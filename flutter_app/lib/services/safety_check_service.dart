import '../models/app_user.dart';
import '../models/medicine.dart';

enum SafetySeverity { none, info, warning, danger, emergency }

class SafetyCheckResult {
  final bool isSafe;
  final SafetySeverity severity;
  final List<String> warnings;
  final List<String> interactionsFound;
  final List<String> allergiesTriggered;
  final bool isDuplicate;
  final bool isEmergencyTriggered;
  final String emergencyMessage;
  final String recommendedSpecialty;

  SafetyCheckResult({
    required this.isSafe,
    required this.severity,
    required this.warnings,
    required this.interactionsFound,
    required this.allergiesTriggered,
    required this.isDuplicate,
    required this.isEmergencyTriggered,
    required this.emergencyMessage,
    required this.recommendedSpecialty,
  });

  factory SafetyCheckResult.safe() {
    return SafetyCheckResult(
      isSafe: true,
      severity: SafetySeverity.none,
      warnings: [],
      interactionsFound: [],
      allergiesTriggered: [],
      isDuplicate: false,
      isEmergencyTriggered: false,
      emergencyMessage: '',
      recommendedSpecialty: '',
    );
  }
}

class SafetyCheckService {
  static const String disclaimerText =
      "DISCLAIMER: HeartBeat360 is an informational health assistant and rule-based guidance system. "
      "It does NOT provide medical diagnoses or replace professional consultation. "
      "In case of a medical emergency, immediately call your local emergency services hotline or go to the nearest emergency room.";

  // Predefined emergency keywords for triage check
  static final List<String> _emergencyKeywords = [
    'chest pain',
    'heart attack',
    'difficulty breathing',
    'shortness of breath',
    'can\'t breathe',
    'severe bleeding',
    'unconscious',
    'loss of consciousness',
    'stroke',
    'numbness on one side',
    'anaphylaxis',
    'severe allergic reaction',
    'poisoning',
    'seizure',
    'head injury',
    'coughing blood',
    'suicidal',
    'severe burn',
  ];

  /// 1. Emergency Symptom Check (runs on query text or assistant prompt)
  static SafetyCheckResult evaluateSymptoms(String queryText) {
    final textLower = queryText.toLowerCase();
    
    for (final keyword in _emergencyKeywords) {
      if (textLower.contains(keyword)) {
        return SafetyCheckResult(
          isSafe: false,
          severity: SafetySeverity.emergency,
          warnings: [
            "CRITICAL EMERGENCY ALERT: Your entry mentions symptoms suggestive of a medical emergency ('$keyword')."
          ],
          interactionsFound: [],
          allergiesTriggered: [],
          isDuplicate: false,
          isEmergencyTriggered: true,
          emergencyMessage:
              "High-priority red flag detected! Please seek immediate emergency medical care or dial emergency services (e.g. 911 / 112 / 102).",
          recommendedSpecialty: "Emergency Medicine",
        );
      }
    }

    return SafetyCheckResult.safe();
  }

  /// 2. Medicine Safety Evaluation (Allergies, Interactions, Duplicates)
  static SafetyCheckResult checkMedicineSafety({
    required Medicine medicine,
    required AppUser user,
  }) {
    final warnings = <String>[];
    final interactionsFound = <String>[];
    final allergiesTriggered = <String>[];
    bool isDuplicate = false;
    SafetySeverity severity = SafetySeverity.none;

    final genNameLower = medicine.genericName.toLowerCase();
    final medNameLower = medicine.medicineName.toLowerCase();

    // Check Allergy cross-match
    for (final allergy in user.allergies) {
      final allergyLower = allergy.toLowerCase();
      if (genNameLower.contains(allergyLower) ||
          allergyLower.contains(genNameLower) ||
          medNameLower.contains(allergyLower)) {
        allergiesTriggered.add(allergy);
        warnings.add("ALLERGY WARNING: Medicine generic name '${medicine.genericName}' matches known allergen '$allergy'.");
        severity = SafetySeverity.danger;
      }
    }

    // Check Medicine Interactions against user.currentMedicines
    for (final currentMed in user.currentMedicines) {
      final curLower = currentMed.toLowerCase();

      // Check if searched medicine lists currentMed as conflicting
      for (final inter in medicine.interactions) {
        final interLower = inter.toLowerCase();
        if (interLower.contains(curLower) || curLower.contains(interLower)) {
          interactionsFound.add(currentMed);
          warnings.add("DRUG INTERACTION: '${medicine.medicineName}' may interact with your active medicine '$currentMed'.");
          if (severity != SafetySeverity.danger) severity = SafetySeverity.warning;
        }
      }
    }

    // Check Duplicate Medicine in current_medicines
    for (final currentMed in user.currentMedicines) {
      final curLower = currentMed.toLowerCase();
      if (curLower == medNameLower || curLower == genNameLower || genNameLower.contains(curLower)) {
        isDuplicate = true;
        warnings.add("DUPLICATE MEDICINE: '${medicine.medicineName}' is already listed in your active current medicines.");
        if (severity == SafetySeverity.none) severity = SafetySeverity.info;
      }
    }

    final isSafe = allergiesTriggered.isEmpty && interactionsFound.isEmpty;

    return SafetyCheckResult(
      isSafe: isSafe,
      severity: severity,
      warnings: warnings,
      interactionsFound: interactionsFound,
      allergiesTriggered: allergiesTriggered,
      isDuplicate: isDuplicate,
      isEmergencyTriggered: false,
      emergencyMessage: '',
      recommendedSpecialty: isSafe ? '' : 'General Medicine',
    );
  }
}
