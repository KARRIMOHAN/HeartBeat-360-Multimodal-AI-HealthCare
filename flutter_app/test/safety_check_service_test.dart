import 'package:flutter_test/flutter_test.dart';
import 'package:heartbeat360/models/app_user.dart';
import 'package:heartbeat360/models/medicine.dart';
import 'package:heartbeat360/services/safety_check_service.dart';

void main() {
  group('SafetyCheckService Unit Tests', () {
    final testUser = AppUser(
      id: 'usr_test',
      name: 'Test Patient',
      age: 40,
      language: 'English',
      allergies: ['Penicillin', 'Aspirin'],
      currentMedicines: ['Lisinopril 10mg', 'Metformin 850mg'],
    );

    test('Detects Allergy Warning when generic name matches user allergy', () {
      final penicillinMed = Medicine(
        id: 'med_pen',
        medicineName: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin Penicillin',
        uses: ['Bacterial Infections'],
        precautions: ['Take with food'],
        sideEffects: ['Nausea'],
        interactions: [],
      );

      final result = SafetyCheckService.checkMedicineSafety(
        medicine: penicillinMed,
        user: testUser,
      );

      expect(result.isSafe, isFalse);
      expect(result.allergiesTriggered, contains('Penicillin'));
      expect(result.severity, equals(SafetySeverity.danger));
    });

    test('Detects Medicine Interaction when medicine conflicts with active current medicines', () {
      final ibuprofen = Medicine(
        id: 'med_ibu',
        medicineName: 'Ibuprofen 400mg',
        genericName: 'Ibuprofen',
        uses: ['Pain relief'],
        precautions: [],
        sideEffects: [],
        interactions: ['Lisinopril', 'Warfarin'],
      );

      final result = SafetyCheckService.checkMedicineSafety(
        medicine: ibuprofen,
        user: testUser,
      );

      expect(result.isSafe, isFalse);
      expect(result.interactionsFound, contains('Lisinopril 10mg'));
    });

    test('Detects Duplicate Medicine in active current medicines', () {
      final lisinopril = Medicine(
        id: 'med_lis',
        medicineName: 'Lisinopril 10mg',
        genericName: 'Lisinopril',
        uses: ['Hypertension'],
        precautions: [],
        sideEffects: [],
        interactions: [],
      );

      final result = SafetyCheckService.checkMedicineSafety(
        medicine: lisinopril,
        user: testUser,
      );

      expect(result.isDuplicate, isTrue);
    });

    test('Emergency Symptom Triage flags chest pain and red flag keywords', () {
      final result1 = SafetyCheckService.evaluateSymptoms('I am experiencing severe chest pain and shortness of breath.');
      expect(result1.isEmergencyTriggered, isTrue);
      expect(result1.severity, equals(SafetySeverity.emergency));
      expect(result1.recommendedSpecialty, equals('Emergency Medicine'));

      final result2 = SafetyCheckService.evaluateSymptoms('I have a mild headache.');
      expect(result2.isEmergencyTriggered, isFalse);
    });
  });
}
