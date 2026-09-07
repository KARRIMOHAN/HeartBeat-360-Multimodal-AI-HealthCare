import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/medicine.dart';
import '../../providers/app_providers.dart';
import '../../services/safety_check_service.dart';
import '../../widgets/disclaimer_banner.dart';
import '../../widgets/safety_alert_dialog.dart';

class MedicineDetailScreen extends ConsumerWidget {
  final Medicine medicine;

  const MedicineDetailScreen({super.key, required this.medicine});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);
    final safetyResult = SafetyCheckService.checkMedicineSafety(
      medicine: medicine,
      user: user,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(medicine.medicineName, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.teal.shade800,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          const DisclaimerBanner(compact: true),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Banner
                  Card(
                    color: Colors.teal.shade50,
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundColor: Colors.teal.shade100,
                            child: Icon(Icons.medication, color: Colors.teal.shade900, size: 34),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(medicine.medicineName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                const SizedBox(height: 4),
                                Text("Generic: ${medicine.genericName}", style: TextStyle(color: Colors.grey.shade800, fontSize: 13)),
                                Text("Form: ${medicine.dosageForm} • ${medicine.category}", style: TextStyle(color: Colors.teal.shade800, fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // CLINICAL SAFETY ASSESSMENT CARD
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: safetyResult.isSafe
                          ? Colors.green.shade50
                          : (safetyResult.severity == SafetySeverity.danger
                              ? Colors.red.shade50
                              : Colors.orange.shade50),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: safetyResult.isSafe
                            ? Colors.green.shade300
                            : (safetyResult.severity == SafetySeverity.danger
                                ? Colors.red.shade400
                                : Colors.orange.shade400),
                        width: 1.5,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              safetyResult.isSafe
                                  ? Icons.check_circle
                                  : (safetyResult.severity == SafetySeverity.danger
                                      ? Icons.warning
                                      : Icons.info),
                              color: safetyResult.isSafe
                                  ? Colors.green.shade800
                                  : (safetyResult.severity == SafetySeverity.danger
                                      ? Colors.red.shade800
                                      : Colors.orange.shade900),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              safetyResult.isSafe
                                  ? "CLINICAL SAFETY CHECK PASSED"
                                  : "SAFETY CONCERNS DETECTED",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: safetyResult.isSafe
                                    ? Colors.green.shade900
                                    : (safetyResult.severity == SafetySeverity.danger
                                        ? Colors.red.shade900
                                        : Colors.orange.shade950),
                              ),
                            ),
                          ],
                        ),
                        if (!safetyResult.isSafe) ...[
                          const SizedBox(height: 10),
                          ...safetyResult.warnings.map(
                            (w) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text("• $w", style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12.5)),
                            ),
                          ),
                        ] else ...[
                          const SizedBox(height: 6),
                          const Text("No active drug interactions or allergy conflicts found with your recorded profile.", style: TextStyle(fontSize: 12)),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Standard Dosage
                  _buildDetailSection("Standard Dosage", Icons.schedule, medicine.standardDosage),
                  const SizedBox(height: 16),

                  // Primary Uses
                  _buildListSection("Primary Uses", Icons.task_alt, medicine.uses),
                  const SizedBox(height: 16),

                  // Clinical Precautions
                  _buildListSection("Precautions & Contraindications", Icons.shield, medicine.precautions),
                  const SizedBox(height: 16),

                  // Known Side Effects
                  _buildListSection("Side Effects", Icons.coronavirus, medicine.sideEffects),
                  const SizedBox(height: 16),

                  // Potential Drug Interactions
                  _buildListSection("Known Drug Interactions", Icons.compare_arrows, medicine.interactions),
                  const SizedBox(height: 24),

                  // Action Button to Add to User Current Medicines
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.teal.shade800,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        if (!safetyResult.isSafe) {
                          showDialog(
                            context: context,
                            builder: (ctx) => SafetyAlertDialog(
                              safetyResult: safetyResult,
                              onProceedAnyway: () {
                                ref.read(userProvider.notifier).addCurrentMedicine(medicine.medicineName);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text("Added ${medicine.medicineName} to your profile medicines.")),
                                );
                              },
                            ),
                          );
                        } else {
                          ref.read(userProvider.notifier).addCurrentMedicine(medicine.medicineName);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("Added ${medicine.medicineName} to active medicines.")),
                          );
                        }
                      },
                      icon: const Icon(Icons.add_task),
                      label: const Text("Add to My Current Medicines", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailSection(String title, IconData icon, String text) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.teal.shade800, size: 20),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
          child: Text(text, style: const TextStyle(fontSize: 13, height: 1.3)),
        ),
      ],
    );
  }

  Widget _buildListSection(String title, IconData icon, List<String> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.teal.shade800, size: 20),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          ],
        ),
        const SizedBox(height: 6),
        ...items.map((it) => Padding(
          padding: const EdgeInsets.only(bottom: 4.0, left: 4.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("• ", style: TextStyle(fontWeight: FontWeight.bold)),
              Expanded(child: Text(it, style: const TextStyle(fontSize: 13, height: 1.3))),
            ],
          ),
        )),
      ],
    );
  }
}
