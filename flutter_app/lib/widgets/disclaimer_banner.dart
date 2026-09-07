import 'package:flutter/material.dart';

class DisclaimerBanner extends StatelessWidget {
  final bool compact;

  const DisclaimerBanner({super.key, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: 16.0,
        vertical: compact ? 8.0 : 12.0,
      ),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        border: Border(
          top: BorderSide(color: Colors.amber.shade400, width: 1),
          bottom: BorderSide(color: Colors.amber.shade400, width: 1),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: Colors.amber.shade900,
            size: compact ? 18 : 22,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              "HeartBeat360 is an informational assistant. Content is non-diagnostic and does not replace professional medical advice or emergency care.",
              style: TextStyle(
                fontSize: compact ? 11.5 : 12.5,
                color: Colors.amber.shade950,
                fontWeight: FontWeight.w500,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
