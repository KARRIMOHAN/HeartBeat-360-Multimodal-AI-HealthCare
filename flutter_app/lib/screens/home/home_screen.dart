import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/app_providers.dart';
import '../../models/medical_field_model.dart';
import '../../widgets/disclaimer_banner.dart';
import '../medical_fields/generic_medical_field_screen.dart';

class HomeScreen extends ConsumerWidget {
  final Function(int) onNavigateTab;

  const HomeScreen({super.key, required this.onNavigateTab});

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
    final user = ref.watch(userProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.shield_outlined, color: Colors.teal.shade300, size: 26),
            const SizedBox(width: 8),
            const Text("HeartBeat360", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
          ],
        ),
        backgroundColor: Colors.teal.shade900,
        foregroundColor: Colors.white,
        elevation: 2,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => onNavigateTab(4), // Go to My Health (reminders)
          ),
        ],
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
                  // Greeting Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.teal.shade800, Colors.teal.shade600],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Welcome, ${user.name} 👋",
                          style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          "Your trusted multimodal healthcare assistant & clinical directory.",
                          style: TextStyle(color: Colors.white90, fontSize: 13),
                        ),
                        const SizedBox(height: 14),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.amber.shade700,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () => onNavigateTab(1), // Ask Assistant
                          icon: const Icon(Icons.chat_bubble_outline, size: 18),
                          label: const Text("Ask Health Assistant (Text/Voice)", style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Quick Action Shortcuts Grid
                  const Text("Quick Healthcare Services", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildShortcutTile(context, "Medicines & Scan", Icons.medication, Colors.blue.shade700, () => onNavigateTab(2)),
                      const SizedBox(width: 12),
                      _buildShortcutTile(context, "20 Specialties", Icons.grid_view, Colors.teal.shade700, () => onNavigateTab(3)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildShortcutTile(context, "Find Doctor", Icons.person_search, Colors.indigo.shade700, () => onNavigateTab(3)),
                      const SizedBox(width: 12),
                      _buildShortcutTile(context, "Emergency Help", Icons.emergency, Colors.red.shade700, () => onNavigateTab(5)),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Featured Specialties (Data Driven)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Medical Specialties (20 Available)", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      TextButton(
                        onPressed: () => onNavigateTab(2),
                        child: const Text("View All 20"),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 130,
                    child: fieldsAsync.when(
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (e, s) => Text("Error: $e"),
                      data: (fields) => ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: fields.length,
                        itemBuilder: (ctx, idx) {
                          final field = fields[idx];
                          return Container(
                            width: 140,
                            margin: const EdgeInsets.only(right: 12),
                            child: Card(
                              elevation: 2,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(12),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => GenericMedicalFieldScreen(field: field),
                                    ),
                                  );
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(10.0),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      CircleAvatar(
                                        backgroundColor: Colors.teal.shade50,
                                        child: Icon(_getIcon(field.iconName), color: Colors.teal.shade800),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        field.fieldName,
                                        textAlign: TextAlign.center,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Emergency Call Out Banner
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.shade300),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.contact_support, color: Colors.red.shade800, size: 32),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Need Immediate First-Aid?", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                              Text("Access step-by-step emergency guidance & direct helpline.", style: TextStyle(fontSize: 12)),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade800, foregroundColor: Colors.white),
                          onPressed: () => onNavigateTab(5),
                          child: const Text("Triage"),
                        ),
                      ],
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

  Widget _buildShortcutTile(BuildContext context, String label, IconData icon, Color color, VoidCallback onTap) {
    return Expanded(
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: color.withOpacity(0.1),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    label,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
