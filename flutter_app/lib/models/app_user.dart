class AppUser {
  final String id;
  final String name;
  final String email;
  final int age;
  final String language;
  final List<String> allergies;
  final List<String> currentMedicines;

  AppUser({
    required this.id,
    required this.name,
    this.email = '',
    required this.age,
    required this.language,
    required this.allergies,
    required this.currentMedicines,
  });

  factory AppUser.fromJson(Map<String, dynamic> json, {String? id}) {
    return AppUser(
      id: id ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      age: json['age'] is int ? json['age'] : int.tryParse(json['age']?.toString() ?? '0') ?? 0,
      language: json['language'] ?? 'English',
      allergies: List<String>.from(json['allergies'] ?? []),
      currentMedicines: List<String>.from(json['current_medicines'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'age': age,
      'language': language,
      'allergies': allergies,
      'current_medicines': currentMedicines,
    };
  }

  AppUser copyWith({
    String? name,
    String? email,
    int? age,
    String? language,
    List<String>? allergies,
    List<String>? currentMedicines,
  }) {
    return AppUser(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      age: age ?? this.age,
      language: language ?? this.language,
      allergies: allergies ?? this.allergies,
      currentMedicines: currentMedicines ?? this.currentMedicines,
    );
  }
}
