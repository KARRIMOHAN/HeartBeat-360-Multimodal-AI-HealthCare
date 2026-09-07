import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/medical_field_model.dart';
import '../../providers/app_providers.dart';
import '../../widgets/disclaimer_banner.dart';
import 'generic_medical_field_screen.dart';

class FieldsListScreen extends ConsumerWidget {
  const FieldsListScreen({super.key});

  IconData _getIcon(String iconName) {
    switch (iconName) {
      case 'favorite': return Icons.favorite;
      case 'face': return Icons.face;
      case 'child_care': return Icons.child_care;
      case 'pregnant_woman': return Icons.pregnant_woman;
      case 'accessibility_new': return Icons.accessibility_new;
      case 'fitness_center': return Icons.fitness_center;
      case 'psychology': return Icons.psychology;
      case 'air': return Icons.air;
      case 'restaurant': return Icons.restaurant;
      case 'water_drop': return Icons.water_drop;
      case 'science': return Icons.science;
      case 'visibility': return Icons.visibility;
      case 'hearing': return Icons.hearing;
      case 'monitor_heart': return Icons.monitor_heart;
      case 'local_hospital': return Icons.local_hospital;
      default: return Icons.medical_services;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fieldsAsync = ref.watch(medicalFieldsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("20 Medical Specialties", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.teal.shade800,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          const DisclaimerBanner(compact: true),
          Expanded(
            child: fieldsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text("Error loading fields: $err")),
              data: (fields) => GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.1,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: fields.length,
                itemBuilder: (context, index) {
                  final field = fields[index];
                  return Card(
                    elevation: 3,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => GenericMedicalFieldScreen(field: field),
                          ),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CircleAvatar(
                              radius: 26,
                              backgroundColor: Colors.teal.shade50,
                              child: Icon(_getIcon(field.iconName), color: Colors.teal.shade800, size: 28),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              field.fieldName,
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "${field.conditions.length} conditions",
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
