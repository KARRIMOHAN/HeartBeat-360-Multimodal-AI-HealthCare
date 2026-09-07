"""
HeartBeat 360 — Qwen Scanner & Search Tool Verification Script
Tests the 2-stage Qwen LLM + Search Tool pipeline:
  User scans → Qwen LLM → Search Tool → Web Results → Qwen LLM → Final Answer
"""

import sys
import unittest
from fastapi.testclient import TestClient

from backend.app.config import get_settings
from backend.app.main import app
from backend.app.ai.search_service import MedicalSearchService
from backend.app.ai.qwen_scanner import QwenScannerService
from backend.app.ai.orchestrator import AIOrchestrator


class TestQwenScannerPipeline(unittest.TestCase):

    def setUp(self):
        self.settings = get_settings()
        self.search_service = MedicalSearchService()
        self.qwen_scanner = QwenScannerService()
        self.orchestrator = AIOrchestrator()
        self.client = TestClient(app)

    def test_01_search_service_active_provider(self):
        """Verify search service provider determination and clinical search."""
        provider = self.search_service.get_active_provider()
        self.assertIn(provider, ["tavily", "serper", "brave", "clinical_fallback"])

        results = self.search_service.search("Amoxicillin 500mg indications dosage", max_results=2)
        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0)
        self.assertIn("title", results[0])
        self.assertIn("snippet", results[0])
        print(f"PASS: Search Service active provider: {provider} with {len(results)} results")

    def test_02_qwen_scanner_initialization(self):
        """Verify QwenScannerService initializes with Qwen models."""
        self.assertEqual(self.qwen_scanner.vl_model, self.settings.hf_qwen_vl_model)
        self.assertEqual(self.qwen_scanner.text_model, self.settings.hf_qwen_text_model)
        print(f"PASS: Qwen Scanner models: VL={self.qwen_scanner.vl_model}, Text={self.qwen_scanner.text_model}")

    def test_03_tablet_scan_pipeline(self):
        """Verify full 2-stage tablet scan with Qwen LLM and search tool."""
        res = self.orchestrator.process_tablet_scan(
            medicine_name="Augmentin 625 Duo",
            patient_weight=68.0,
            patient_age=32,
            patient_allergies=["Penicillin"],
            current_medicines=["None"]
        )

        self.assertTrue(res.get("success"))
        self.assertIsNotNone(res.get("brand_name"))
        self.assertIsNotNone(res.get("reply"))
        self.assertIsInstance(res.get("search_queries"), list)
        self.assertIsInstance(res.get("search_citations"), list)
        self.assertIn("Qwen", res.get("model_used", ""))
        print(f"PASS: Tablet Scan verified! Brand: {res.get('brand_name')}, Pipeline: {res.get('model_used')}")

    def test_04_medical_report_scan_pipeline(self):
        """Verify full 2-stage medical report scan with Qwen LLM and search tool."""
        res = self.orchestrator.process_medical_scan(
            title="Comprehensive Blood Count (CBC) & Metabolic Panel",
            patient_context={"age": 45, "gender": "Female"}
        )

        self.assertTrue(res.get("success"))
        self.assertIsNotNone(res.get("report_title"))
        self.assertIsInstance(res.get("structured_findings"), list)
        self.assertGreater(len(res.get("structured_findings")), 0)
        self.assertIsNotNone(res.get("plain_language_explanation"))
        print(f"PASS: Medical Report Scan verified! Title: {res.get('report_title')}, Parameters: {len(res.get('structured_findings'))}")

    def test_05_api_endpoints(self):
        """Verify FastAPI HTTP endpoints for /scan-medicine and /scan-report."""
        # Test /api/patient/scan-medicine
        med_resp = self.client.post("/api/patient/scan-medicine", data={
            "medicine_name": "Metformin 500mg",
            "patient_weight": "75",
            "patient_age": "50"
        })
        self.assertEqual(med_resp.status_code, 200)
        med_data = med_resp.json()
        self.assertEqual(med_data.get("status"), "scanned")
        self.assertIn("Qwen", med_data.get("model_used", ""))
        self.assertIn("search_citations", med_data)
        print("PASS: POST /api/patient/scan-medicine HTTP 200 OK")

        # Test /api/patient/scan-report
        rep_resp = self.client.post("/api/patient/scan-report", data={
            "title": "Lipid Profile & Cholesterol Test",
            "patient_age": "50",
            "patient_gender": "Male"
        })
        self.assertEqual(rep_resp.status_code, 200)
        rep_data = rep_resp.json()
        self.assertEqual(rep_data.get("status"), "success")
        self.assertIn("structured_findings", rep_data)
        self.assertIn("Qwen", rep_data.get("ai_model_used", ""))
        print("PASS: POST /api/patient/scan-report HTTP 200 OK")


if __name__ == "__main__":
    unittest.main()
