import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/app_providers.dart';
import '../../models/doctor_model.dart';
import '../../widgets/disclaimer_banner.dart';
import 'appointment_booking_screen.dart';

class DoctorsScreen extends ConsumerWidget {
  const DoctorsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final doctorsAsync = ref.watch(doctorsProvider);
    final fieldsAsync = ref.watch(medicalFieldsProvider);
    final selectedSpecialty = ref.watch(doctorSpecialtyFilterProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Find & Book Doctors", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.teal.shade800,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          const DisclaimerBanner(compact: true),
          // Specialty & Location Search Header
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              children: [
                // Specialty Dropdown Filter
                fieldsAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (e, s) => const SizedBox.shrink(),
                  data: (fields) => DropdownButtonFormField<String?>(
                    value: selectedSpecialty,
                    decoration: InputDecoration(
                      labelText: "Filter by Specialty",
                      prefixIcon: const Icon(Icons.medical_information),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    items: [
                      const DropdownMenuItem<String?>(
                        value: null,
                        child: Text("All Medical Specialties"),
                      ),
                      ...fields.map((f) => DropdownMenuItem<String?>(
                            value: f.fieldName,
                            child: Text(f.fieldName),
                          )),
                    ],
                    onChanged: (val) {
                      ref.read(doctorSpecialtyFilterProvider.notifier).state = val;
                    },
                  ),
                ),
                const SizedBox(height: 8),
                // Location Input Filter
                TextField(
                  decoration: InputDecoration(
                    hintText: "Search by City or Hospital Location...",
                    prefixIcon: const Icon(Icons.location_on),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onChanged: (val) {
                    ref.read(doctorLocationFilterProvider.notifier).state = val;
                  },
                ),
              ],
            ),
          ),
          Expanded(
            child: doctorsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text("Error: $err")),
              data: (doctors) {
                if (doctors.isEmpty) {
                  return const Center(child: Text("No doctors matching selected filters."));
                }
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: doctors.length,
                  itemBuilder: (context, idx) {
                    final doc = doctors[idx];
                    return Card(
                      elevation: 2,
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(14.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 26,
                                  backgroundColor: Colors.teal.shade100,
                                  child: Icon(Icons.person, color: Colors.teal.shade900, size: 28),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(doc.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                      Text(doc.qualification, style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
                                      Text("Specialty: ${doc.specialty}", style: TextStyle(color: Colors.teal.shade800, fontWeight: FontWeight.w600, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(8)),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.star, color: Colors.amber, size: 16),
                                      Text(" ${doc.rating}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 20),
                            Row(
                              children: [
                                Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                                const SizedBox(width: 4),
                                Expanded(child: Text(doc.location, style: TextStyle(fontSize: 12, color: Colors.grey.shade800))),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(color: Colors.teal.shade50, borderRadius: BorderRadius.circular(4)),
                                  child: Text(
                                    doc.consultationType == ConsultationType.both
                                        ? "In-Person & Video"
                                        : doc.consultationType.name.toUpperCase(),
                                    style: TextStyle(fontSize: 11, color: Colors.teal.shade900, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.teal.shade700,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (ctx) => AppointmentBookingScreen(doctor: doc),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.calendar_month, size: 18),
                                label: const Text("Book Appointment"),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
