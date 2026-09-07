class EducationalContent {
  final String id;
  final String fieldName;
  final String title;
  final String description;
  final String imageUrl;
  final String videoUrl;
  final String reviewDate;
  final String contentType; // 'photo', 'video', or 'infographic'

  EducationalContent({
    required this.id,
    required this.fieldName,
    required this.title,
    required this.description,
    required this.imageUrl,
    required this.videoUrl,
    required this.reviewDate,
    this.contentType = 'photo',
  });

  factory EducationalContent.fromJson(Map<String, dynamic> json, {String? id}) {
    return EducationalContent(
      id: id ?? json['id'] ?? '',
      fieldName: json['field_name'] ?? json['fieldName'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      imageUrl: json['image'] ?? json['imageUrl'] ?? '',
      videoUrl: json['video'] ?? json['videoUrl'] ?? '',
      reviewDate: json['review_date']?.toString() ?? json['reviewDate']?.toString() ?? '2026-08-01',
      contentType: json['content_type'] ?? (json['video'] != null && json['video'].toString().isNotEmpty ? 'video' : 'photo'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'field_name': fieldName,
      'title': title,
      'description': description,
      'image': imageUrl,
      'video': videoUrl,
      'review_date': reviewDate,
      'content_type': contentType,
    };
  }
}
