class MedicalField {
  final String id;
  final String fieldName;
  final String description;
  final List<String> conditions;
  final List<String> safetyTips;
  final List<String> doctorIds;
  final List<String> symptomsAndWarnings;
  final String emergencyGuidance;
  final String iconName;

  MedicalField({
    required this.id,
    required this.fieldName,
    required this.description,
    required this.conditions,
    required this.safetyTips,
    required this.doctorIds,
    this.symptomsAndWarnings = const [],
    this.emergencyGuidance = 'If experiencing acute crisis or severe pain, contact emergency medical services immediately.',
    this.iconName = 'medical_services',
  });

  factory MedicalField.fromJson(Map<String, dynamic> json, {String? id}) {
    return MedicalField(
      id: id ?? json['id'] ?? '',
      fieldName: json['field_name'] ?? json['fieldName'] ?? '',
      description: json['description'] ?? '',
      conditions: List<String>.from(json['conditions'] ?? []),
      safetyTips: List<String>.from(json['safety_tips'] ?? json['safetyTips'] ?? []),
      doctorIds: List<String>.from(json['doctor_ids'] ?? json['doctorIds'] ?? []),
      symptomsAndWarnings: List<String>.from(json['symptoms_and_warnings'] ?? json['symptomsAndWarnings'] ?? []),
      emergencyGuidance: json['emergency_guidance'] ?? 'For severe acute symptoms, seek immediate emergency medical care.',
      iconName: json['icon_name'] ?? 'medical_services',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'field_name': fieldName,
      'description': description,
      'conditions': conditions,
      'safety_tips': safetyTips,
      'doctor_ids': doctorIds,
      'symptoms_and_warnings': symptomsAndWarnings,
      'emergency_guidance': emergencyGuidance,
      'icon_name': iconName,
    };
  }
}
