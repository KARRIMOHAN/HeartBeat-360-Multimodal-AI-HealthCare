class HealthReminder {
  final String id;
  final String userId;
  final String reminderType; // medicine, appointment, test, workout
  final String title;
  final String date;
  final String time;
  final bool isActive;

  HealthReminder({
    required this.id,
    required this.userId,
    required this.reminderType,
    required this.title,
    required this.date,
    required this.time,
    this.isActive = true,
  });

  factory HealthReminder.fromJson(Map<String, dynamic> json, {String? id}) {
    return HealthReminder(
      id: id ?? json['id'] ?? '',
      userId: json['user_id'] ?? json['userId'] ?? '',
      reminderType: json['reminder_type'] ?? json['reminderType'] ?? 'medicine',
      title: json['title'] ?? '',
      date: json['date'] ?? '',
      time: json['time'] ?? '',
      isActive: json['is_active'] ?? json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'reminder_type': reminderType,
      'title': title,
      'date': date,
      'time': time,
      'is_active': isActive,
    };
  }
}
