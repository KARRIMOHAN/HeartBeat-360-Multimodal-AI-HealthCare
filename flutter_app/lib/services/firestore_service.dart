import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/app_user.dart';
import '../models/doctor_model.dart';
import '../models/medical_field_model.dart';
import '../models/medicine.dart';
import '../models/content_model.dart';
import '../models/appointment_model.dart';
import '../models/reminder_model.dart';
import 'mock_data.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // 1. Medical Fields
  Future<List<MedicalField>> getMedicalFields() async {
    try {
      final snap = await _db.collection('medical_fields').get();
      if (snap.docs.isNotEmpty) {
        return snap.docs
            .map((doc) => MedicalField.fromJson(doc.data(), id: doc.id))
            .toList();
      }
    } catch (e) {
      debugPrint("Firestore getMedicalFields fallback to mock: $e");
    }
    return MockData.medicalFields;
  }

  Future<MedicalField?> getMedicalFieldByName(String fieldName) async {
    try {
      final snap = await _db
          .collection('medical_fields')
          .where('field_name', isEqualTo: fieldName)
          .limit(1)
          .get();
      if (snap.docs.isNotEmpty) {
        return MedicalField.fromJson(snap.docs.first.data(), id: snap.docs.first.id);
      }
    } catch (e) {
      debugPrint("Firestore getMedicalFieldByName fallback to mock: $e");
    }
    return MockData.medicalFields.firstWhere(
      (f) => f.fieldName.toLowerCase() == fieldName.toLowerCase(),
      orElse: () => MockData.medicalFields.first,
    );
  }

  // 2. Doctors
  Future<List<DoctorProfile>> getDoctors({String? specialty, String? locationQuery}) async {
    try {
      Query query = _db.collection('doctors');
      if (specialty != null && specialty.isNotEmpty) {
        query = query.where('specialty', isEqualTo: specialty);
      }
      final snap = await query.get();
      if (snap.docs.isNotEmpty) {
        var list = snap.docs
            .map((doc) => DoctorProfile.fromJson(doc.data() as Map<String, dynamic>, id: doc.id))
            .toList();
        if (locationQuery != null && locationQuery.isNotEmpty) {
          list = list.where((d) => d.location.toLowerCase().contains(locationQuery.toLowerCase())).toList();
        }
        return list;
      }
    } catch (e) {
      debugPrint("Firestore getDoctors fallback to mock: $e");
    }

    var list = MockData.doctors;
    if (specialty != null && specialty.isNotEmpty) {
      list = list.where((d) => d.specialty.toLowerCase() == specialty.toLowerCase()).toList();
    }
    if (locationQuery != null && locationQuery.isNotEmpty) {
      list = list.where((d) => d.location.toLowerCase().contains(locationQuery.toLowerCase())).toList();
    }
    return list;
  }

  // 3. Medicines
  Future<List<Medicine>> getMedicines({String? queryStr}) async {
    try {
      final snap = await _db.collection('medicines').get();
      if (snap.docs.isNotEmpty) {
        var list = snap.docs
            .map((doc) => Medicine.fromJson(doc.data(), id: doc.id))
            .toList();
        if (queryStr != null && queryStr.isNotEmpty) {
          final qLower = queryStr.toLowerCase();
          list = list.where((m) =>
            m.medicineName.toLowerCase().contains(qLower) ||
            m.genericName.toLowerCase().contains(qLower) ||
            m.uses.any((u) => u.toLowerCase().contains(qLower))
          ).toList();
        }
        return list;
      }
    } catch (e) {
      debugPrint("Firestore getMedicines fallback to mock: $e");
    }

    var list = MockData.medicines;
    if (queryStr != null && queryStr.isNotEmpty) {
      final qLower = queryStr.toLowerCase();
      list = list.where((m) =>
        m.medicineName.toLowerCase().contains(qLower) ||
        m.genericName.toLowerCase().contains(qLower) ||
        m.uses.any((u) => u.toLowerCase().contains(qLower))
      ).toList();
    }
    return list;
  }

  // 4. Educational Content
  Future<List<EducationalContent>> getContentByField(String fieldName) async {
    try {
      final snap = await _db
          .collection('content')
          .where('field_name', isEqualTo: fieldName)
          .get();
      if (snap.docs.isNotEmpty) {
        return snap.docs
            .map((doc) => EducationalContent.fromJson(doc.data(), id: doc.id))
            .toList();
      }
    } catch (e) {
      debugPrint("Firestore getContentByField fallback to mock: $e");
    }

    return MockData.contentList
        .where((c) => c.fieldName.toLowerCase() == fieldName.toLowerCase())
        .toList();
  }

  // 5. User Profile
  Future<AppUser?> getUserProfile(String userId) async {
    try {
      final doc = await _db.collection('users').doc(userId).get();
      if (doc.exists && doc.data() != null) {
        return AppUser.fromJson(doc.data()!, id: doc.id);
      }
    } catch (e) {
      debugPrint("Firestore getUserProfile fallback to mock: $e");
    }
    return MockData.sampleUser;
  }

  Future<void> saveUserProfile(AppUser user) async {
    try {
      await _db.collection('users').doc(user.id).set(user.toJson(), SetOptions(merge: true));
    } catch (e) {
      debugPrint("Firestore saveUserProfile error: $e");
    }
  }

  // 6. Appointments
  Future<List<Appointment>> getUserAppointments(String patientId) async {
    try {
      final snap = await _db
          .collection('appointments')
          .where('patient_id', isEqualTo: patientId)
          .get();
      if (snap.docs.isNotEmpty) {
        return snap.docs
            .map((doc) => Appointment.fromJson(doc.data(), id: doc.id))
            .toList();
      }
    } catch (e) {
      debugPrint("Firestore getUserAppointments fallback: $e");
    }
    return MockData.appointments;
  }

  Future<bool> bookAppointment(Appointment appointment) async {
    try {
      await _db.collection('appointments').add(appointment.toJson());
      return true;
    } catch (e) {
      debugPrint("Firestore bookAppointment error: $e");
      MockData.appointments.add(appointment);
      return true;
    }
  }

  // 7. Reminders
  Future<List<HealthReminder>> getUserReminders(String userId) async {
    try {
      final snap = await _db
          .collection('reminders')
          .where('user_id', isEqualTo: userId)
          .get();
      if (snap.docs.isNotEmpty) {
        return snap.docs
            .map((doc) => HealthReminder.fromJson(doc.data(), id: doc.id))
            .toList();
      }
    } catch (e) {
      debugPrint("Firestore getUserReminders fallback: $e");
    }
    return MockData.reminders;
  }

  Future<bool> addReminder(HealthReminder reminder) async {
    try {
      await _db.collection('reminders').add(reminder.toJson());
      return true;
    } catch (e) {
      debugPrint("Firestore addReminder error: $e");
      MockData.reminders.add(reminder);
      return true;
    }
  }
}
