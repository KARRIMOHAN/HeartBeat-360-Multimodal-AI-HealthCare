import 'package:flutter_test/flutter_test.dart';
import 'package:heartbeat360/models/medical_field_model.dart';
import 'package:heartbeat360/models/doctor_model.dart';
import 'package:heartbeat360/models/medicine.dart';
import 'package:heartbeat360/models/appointment_model.dart';
import 'package:heartbeat360/models/reminder_model.dart';

void main() {
  group('HeartBeat360 Model Serialization Tests', () {
    test('MedicalField fromJson and toJson parsing', () {
      final json = {
        'id': 'mf_test',
        'field_name': 'Cardiology',
        'description': 'Heart health',
        'conditions': ['CAD', 'Hypertension'],
        'safety_tips': ['Low salt diet'],
        'doctor_ids': ['doc_1'],
        'symptoms_and_warnings': ['Chest pain'],
        'emergency_guidance': 'Call 911 for chest pain',
        'icon_name': 'favorite',
      };

      final field = MedicalField.fromJson(json);
      expect(field.id, equals('mf_test'));
      expect(field.fieldName, equals('Cardiology'));
      expect(field.conditions, contains('Hypertension'));

      final outJson = field.toJson();
      expect(outJson['field_name'], equals('Cardiology'));
    });

    test('DoctorProfile fromJson and toJson parsing', () {
      final json = {
        'id': 'doc_test',
        'name': 'Dr. Sarah Jenkins',
        'specialty': 'Pediatrics',
        'qualification': 'MD, FAAP',
        'location': 'Metro Hospital',
        'availability': [{'day': 'Mon-Fri', 'time': '09:00 AM - 05:00 PM'}],
        'consultation_type': 'both',
        'rating': 4.9,
      };

      final doc = DoctorProfile.fromJson(json);
      expect(doc.name, equals('Dr. Sarah Jenkins'));
      expect(doc.consultationType, equals(ConsultationType.both));
      expect(doc.availability.first.day, equals('Mon-Fri'));
    });

    test('Appointment fromJson and toJson parsing', () {
      final json = {
        'id': 'apt_test',
        'patient_id': 'usr_1',
        'doctor_id': 'doc_1',
        'doctor_name': 'Dr. Rostova',
        'specialty': 'Cardiology',
        'date': '2026-09-01',
        'time': '10:00 AM',
        'status': 'confirmed',
      };

      final apt = Appointment.fromJson(json);
      expect(apt.doctorName, equals('Dr. Rostova'));
      expect(apt.status, equals(AppointmentStatus.confirmed));
    });
  });
}
