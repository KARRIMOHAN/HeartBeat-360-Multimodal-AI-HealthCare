class Medicine {
  final String id;
  final String medicineName;
  final String genericName;
  final List<String> uses;
  final List<String> precautions;
  final List<String> sideEffects;
  final List<String> interactions; // Names or generic names of conflicting medicines
  final String category;
  final String dosageForm;
  final String standardDosage;

  Medicine({
    required this.id,
    required this.medicineName,
    required this.genericName,
    required this.uses,
    required this.precautions,
    required this.sideEffects,
    required this.interactions,
    this.category = 'General',
    this.dosageForm = 'Tablet',
    this.standardDosage = 'As prescribed by physician',
  });

  factory Medicine.fromJson(Map<String, dynamic> json, {String? id}) {
    return Medicine(
      id: id ?? json['id'] ?? '',
      medicineName: json['medicine_name'] ?? json['medicineName'] ?? json['name'] ?? '',
      genericName: json['generic_name'] ?? json['genericName'] ?? '',
      uses: List<String>.from(json['uses'] ?? []),
      precautions: List<String>.from(json['precautions'] ?? []),
      sideEffects: List<String>.from(json['side_effects'] ?? json['sideEffects'] ?? []),
      interactions: List<String>.from(json['interactions'] ?? []),
      category: json['category'] ?? 'General',
      dosageForm: json['dosage_form'] ?? json['dosageForm'] ?? 'Tablet',
      standardDosage: json['standard_dosage'] ?? json['standardDosage'] ?? 'As directed',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'medicine_name': medicineName,
      'generic_name': genericName,
      'uses': uses,
      'precautions': precautions,
      'side_effects': sideEffects,
      'interactions': interactions,
      'category': category,
      'dosage_form': dosageForm,
      'standard_dosage': standardDosage,
    };
  }
}
