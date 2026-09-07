enum AppointmentStatus { pending, confirmed, cancelled, completed }

class Appointment {
  final String id;
  final String patientId;
  final String doctorId;
  final String doctorName;
  final String specialty;
  final String date;
  final String time;
  final AppointmentStatus status;
  final String notes;

  Appointment({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.doctorName,
    required this.specialty,
    required this.date,
    required this.time,
    required this.status,
    this.notes = '',
  });

  factory Appointment.fromJson(Map<String, dynamic> json, {String? id}) {
    AppointmentStatus st = AppointmentStatus.pending;
    final stStr = (json['status'] ?? '').toString().toLowerCase();
    if (stStr == 'confirmed') st = AppointmentStatus.confirmed;
    if (stStr == 'cancelled') st = AppointmentStatus.cancelled;
    if (stStr == 'completed') st = AppointmentStatus.completed;

    return Appointment(
      id: id ?? json['id'] ?? '',
      patientId: json['patient_id'] ?? json['patientId'] ?? '',
      doctorId: json['doctor_id'] ?? json['doctorId'] ?? '',
      doctorName: json['doctor_name'] ?? json['doctorName'] ?? 'Doctor Consultation',
      specialty: json['specialty'] ?? 'General Medicine',
      date: json['date'] ?? '',
      time: json['time'] ?? '',
      status: st,
      notes: json['notes'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patient_id': patientId,
      'doctor_id': doctorId,
      'doctor_name': doctorName,
      'specialty': specialty,
      'date': date,
      'time': time,
      'status': status.name,
      'notes': notes,
    };
  }
}
