import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/medical_field_model.dart';
import '../../models/doctor_model.dart';
import '../../models/medicine.dart';
import '../../models/content_model.dart';
import '../../providers/app_providers.dart';
import '../../widgets/disclaimer_banner.dart';
import '../doctors/appointment_booking_screen.dart';

class GenericMedicalFieldScreen extends ConsumerStatefulWidget {
  final MedicalField field;

  const GenericMedicalFieldScreen({super.key, required this.field});

  @override
  ConsumerState<GenericMedicalFieldScreen> createState() => _GenericMedicalFieldScreenState();
}

class _GenericMedicalFieldScreenState extends ConsumerState<GenericMedicalFieldScreen> {
  List<EducationalContent> _content = [];
  List<Medicine> _relatedMedicines = [];
  List<DoctorProfile> _availableDoctors = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFieldData();
  }

  Future<void> _loadFieldData() async {
    final firestore = ref.read(firestoreServiceProvider);
    
    final contentFuture = firestore.getContentByField(widget.field.fieldName);
    final medicinesFuture = firestore.getMedicines();
    final doctorsFuture = firestore.getDoctors(specialty: widget.field.fieldName);

    final results = await Future.wait([contentFuture, medicinesFuture, doctorsFuture]);

    if (mounted) {
      setState(() {
        _content = results[0] as List<EducationalContent>;
        _relatedMedicines = (results[1] as List<Medicine>).where((m) =>
            m.category.toLowerCase().contains(widget.field.fieldName.toLowerCase()) ||
            m.uses.any((u) => widget.field.conditions.any((c) => u.toLowerCase().contains(c.toLowerCase())))
        ).toList();
        _availableDoctors = results[2] as List<DoctorProfile>;
        _isLoading = false;
      });
    }
  }

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
  Widget build(BuildContext context) {
    final field = widget.field;
    final photos = _content.where((c) => c.contentType == 'photo' || c.imageUrl.isNotEmpty).toList();
    final videos = _content.where((c) => c.contentType == 'video' || c.videoUrl.isNotEmpty).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(field.fieldName, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.teal.shade700,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          const DisclaimerBanner(compact: true),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // SECTION 1: FIELD INFORMATION
                        _buildSectionHeader("1. Field Information", Icons.info),
                        Card(
                          elevation: 2,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 28,
                                  backgroundColor: Colors.teal.shade100,
                                  child: Icon(_getIcon(field.iconName), color: Colors.teal.shade800, size: 32),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Text(
                                    field.description,
                                    style: const TextStyle(fontSize: 14, height: 1.4, color: Colors.black87),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // SECTION 2: COMMON CONDITIONS
                        _buildSectionHeader("2. Common Conditions", Icons.healing),
                        Wrap(
                          spacing: 8.0,
                          runSpacing: 8.0,
                          children: field.conditions.map((cond) => Chip(
                            avatar: Icon(Icons.check_circle_outline, color: Colors.teal.shade700, size: 18),
                            label: Text(cond, style: const TextStyle(fontWeight: FontWeight.w600)),
                            backgroundColor: Colors.teal.shade50,
                            side: BorderSide(color: Colors.teal.shade200),
                          )).toList(),
                        ),
                        const SizedBox(height: 20),

                        // SECTION 3: SYMPTOMS AND WARNING SIGNS
                        _buildSectionHeader("3. Symptoms & Warning Signs", Icons.warning_amber_rounded),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.orange.shade300),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: field.symptomsAndWarnings.map((sym) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4.0),
                              child: Row(
                                children: [
                                  Icon(Icons.report_problem, color: Colors.orange.shade900, size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      sym,
                                      style: TextStyle(fontWeight: FontWeight.w600, color: Colors.orange.shade950, fontSize: 13),
                                    ),
                                  ),
                                ],
                              ),
                            )).toList(),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // SECTION 4: EDUCATIONAL PHOTOS
                        _buildSectionHeader("4. Educational Photos", Icons.photo_library),
                        photos.isEmpty
                            ? _buildEmptyState("No educational photos uploaded yet for ${field.fieldName}.")
                            : SizedBox(
                                height: 160,
                                child: ListView.builder(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: photos.length,
                                  itemBuilder: (ctx, idx) {
                                    final item = photos[idx];
                                    return Container(
                                      width: 220,
                                      margin: const EdgeInsets.only(right: 12),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: Colors.grey.shade300),
                                      ),
                                      clipBehavior: Clip.antiAlias,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Expanded(
                                            child: Image.network(
                                              item.imageUrl,
                                              fit: BoxFit.cover,
                                              width: double.infinity,
                                              errorBuilder: (context, error, stackTrace) => Container(
                                                color: Colors.teal.shade100,
                                                child: const Center(child: Icon(Icons.image, color: Colors.teal)),
                                              ),
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.all(8.0),
                                            child: Text(
                                              item.title,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ),
                        const SizedBox(height: 20),

                        // SECTION 5: EDUCATIONAL VIDEOS
                        _buildSectionHeader("5. Educational Videos", Icons.ondemand_video),
                        videos.isEmpty
                            ? _buildEmptyState("No video guides uploaded yet for ${field.fieldName}.")
                            : Column(
                                children: videos.map((vid) => Card(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  child: ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor: Colors.red.shade100,
                                      child: const Icon(Icons.play_arrow, color: Colors.red),
                                    ),
                                    title: Text(vid.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                                    subtitle: Text(vid.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                                    trailing: const Icon(Icons.open_in_new),
                                    onTap: () {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text("Playing video resource: ${vid.title}")),
                                      );
                                    },
                                  ),
                                )).toList(),
                              ),
                        const SizedBox(height: 20),

                        // SECTION 6: MEDICINES RELATED TO FIELD
                        _buildSectionHeader("6. Medicines Related to Field", Icons.medication),
                        _relatedMedicines.isEmpty
                            ? _buildEmptyState("No specific prescription medicines tagged for ${field.fieldName}.")
                            : Column(
                                children: _relatedMedicines.map((med) => Card(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  child: ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor: Colors.blue.shade50,
                                      child: const Icon(Icons.pill, color: Colors.blue),
                                    ),
                                    title: Text(med.medicineName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                    subtitle: Text("Generic: ${med.genericName} • ${med.category}"),
                                    trailing: const Icon(Icons.chevron_right),
                                  ),
                                )).toList(),
                              ),
                        const SizedBox(height: 20),

                        // SECTION 7 & 8: AVAILABLE DOCTORS & APPOINTMENT BOOKING
                        _buildSectionHeader("7 & 8. Available Doctors & Booking", Icons.medical_information),
                        _availableDoctors.isEmpty
                            ? _buildEmptyState("No active specialists listed for ${field.fieldName} currently.")
                            : Column(
                                children: _availableDoctors.map((doc) => Card(
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
                                              radius: 24,
                                              backgroundColor: Colors.teal.shade100,
                                              child: Text(doc.name[4], style: TextStyle(fontWeight: FontWeight.bold, color: Colors.teal.shade900)),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(doc.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                                  Text(doc.qualification, style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
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
                                        const SizedBox(height: 10),
                                        Row(
                                          children: [
                                            Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                                            const SizedBox(width: 4),
                                            Expanded(child: Text(doc.location, style: TextStyle(fontSize: 12, color: Colors.grey.shade800))),
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
                                                  builder: (context) => AppointmentBookingScreen(doctor: doc),
                                                ),
                                              );
                                            },
                                            icon: const Icon(Icons.calendar_today, size: 18),
                                            label: const Text("Book Appointment Now"),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                )).toList(),
                              ),
                        const SizedBox(height: 20),

                        // SECTION 9: EMERGENCY GUIDANCE
                        _buildSectionHeader("9. Emergency Guidance", Icons.local_hospital),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.red.shade300, width: 1.5),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.emergency, color: Colors.red.shade900, size: 36),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Text(
                                  field.emergencyGuidance,
                                  style: TextStyle(
                                    color: Colors.red.shade950,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13.5,
                                    height: 1.3,
                                  ),
                                ),
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

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: Row(
        children: [
          Icon(icon, color: Colors.teal.shade800, size: 22),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Colors.teal.shade900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(message, style: TextStyle(color: Colors.grey.shade700, fontStyle: FontStyle.italic, fontSize: 13)),
    );
  }
}
