import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/app_user.dart';
import '../models/medical_field_model.dart';
import '../models/doctor_model.dart';
import '../models/medicine.dart';
import '../models/appointment_model.dart';
import '../models/reminder_model.dart';
import '../services/firestore_service.dart';
import '../services/mock_data.dart';
import '../services/safety_check_service.dart';

final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  return FirestoreService();
});

// 1. Current User State Provider
class UserNotifier extends StateNotifier<AppUser> {
  final FirestoreService _firestoreService;
  UserNotifier(this._firestoreService) : super(MockData.sampleUser) {
    loadUser('usr_demo_101');
  }

  Future<void> loadUser(String userId) async {
    final user = await _firestoreService.getUserProfile(userId);
    if (user != null) {
      state = user;
    }
  }

  void updateAllergies(List<String> allergies) {
    state = state.copyWith(allergies: allergies);
    _firestoreService.saveUserProfile(state);
  }

  void addCurrentMedicine(String medicineName) {
    if (!state.currentMedicines.contains(medicineName)) {
      final updated = List<String>.from(state.currentMedicines)..add(medicineName);
      state = state.copyWith(currentMedicines: updated);
      _firestoreService.saveUserProfile(state);
    }
  }

  void removeCurrentMedicine(String medicineName) {
    final updated = List<String>.from(state.currentMedicines)..remove(medicineName);
    state = state.copyWith(currentMedicines: updated);
    _firestoreService.saveUserProfile(state);
  }
}

final userProvider = StateNotifierProvider<UserNotifier, AppUser>((ref) {
  return UserNotifier(ref.read(firestoreServiceProvider));
});

// 2. Medical Fields Provider (20 Specialties)
final medicalFieldsProvider = FutureProvider<List<MedicalField>>((ref) async {
  final service = ref.read(firestoreServiceProvider);
  return await service.getMedicalFields();
});

// 3. Medicines Search & Filter Provider
final medicineSearchQueryProvider = StateProvider<String>((ref) => '');

final medicinesProvider = FutureProvider<List<Medicine>>((ref) async {
  final query = ref.watch(medicineSearchQueryProvider);
  final service = ref.read(firestoreServiceProvider);
  return await service.getMedicines(queryStr: query);
});

// 4. Doctors Search & Filter Providers
final doctorSpecialtyFilterProvider = StateProvider<String?>((ref) => null);
final doctorLocationFilterProvider = StateProvider<String>((ref) => '');

final doctorsProvider = FutureProvider<List<DoctorProfile>>((ref) async {
  final specialty = ref.watch(doctorSpecialtyFilterProvider);
  final location = ref.watch(doctorLocationFilterProvider);
  final service = ref.read(firestoreServiceProvider);
  return await service.getDoctors(specialty: specialty, locationQuery: location);
});

// 5. User Appointments & Reminders Providers
final userAppointmentsProvider = FutureProvider<List<Appointment>>((ref) async {
  final user = ref.watch(userProvider);
  final service = ref.read(firestoreServiceProvider);
  return await service.getUserAppointments(user.id);
});

final userRemindersProvider = FutureProvider<List<HealthReminder>>((ref) async {
  final user = ref.watch(userProvider);
  final service = ref.read(firestoreServiceProvider);
  return await service.getUserReminders(user.id);
});
