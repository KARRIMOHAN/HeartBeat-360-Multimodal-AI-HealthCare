enum ConsultationType { in_person, video, both }

class TimeSlot {
  final String day;
  final String time;

  TimeSlot({required this.day, required this.time});

  factory TimeSlot.fromJson(Map<String, dynamic> json) {
    return TimeSlot(
      day: json['day'] ?? '',
      time: json['time'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'day': day,
      'time': time,
    };
  }
}

class DoctorProfile {
  final String id;
  final String name;
  final String specialty;
  final String qualification;
  final String location;
  final List<TimeSlot> availability;
  final ConsultationType consultationType;
  final double rating;
  final int experienceYears;
  final String hospital;

  DoctorProfile({
    required this.id,
    required this.name,
    required this.specialty,
    required this.qualification,
    required this.location,
    required this.availability,
    required this.consultationType,
    this.rating = 4.8,
    this.experienceYears = 10,
    this.hospital = 'HeartBeat Medical Center',
  });

  factory DoctorProfile.fromJson(Map<String, dynamic> json, {String? id}) {
    ConsultationType cType = ConsultationType.both;
    final typeStr = (json['consultation_type'] ?? '').toString().toLowerCase();
    if (typeStr == 'in_person') {
      cType = ConsultationType.in_person;
    } else if (typeStr == 'video') {
      cType = ConsultationType.video;
    }

    var availList = <TimeSlot>[];
    if (json['availability'] is List) {
      availList = (json['availability'] as List).map((e) {
        if (e is Map<String, dynamic>) {
          return TimeSlot.fromJson(e);
        } else {
          return TimeSlot(day: 'Mon-Fri', time: e.toString());
        }
      }).toList();
    }

    return DoctorProfile(
      id: id ?? json['id'] ?? '',
      name: json['name'] ?? '',
      specialty: json['specialty'] ?? '',
      qualification: json['qualification'] ?? '',
      location: json['location']?.toString() ?? 'City Central',
      availability: availList,
      consultationType: cType,
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : 4.8,
      experienceYears: json['experience_years'] ?? 10,
      hospital: json['hospital'] ?? 'HeartBeat Health Center',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'specialty': specialty,
      'qualification': qualification,
      'location': location,
      'availability': availability.map((a) => a.toJson()).toList(),
      'consultation_type': consultationType.name,
      'rating': rating,
      'experience_years': experienceYears,
      'hospital': hospital,
    };
  }
}
