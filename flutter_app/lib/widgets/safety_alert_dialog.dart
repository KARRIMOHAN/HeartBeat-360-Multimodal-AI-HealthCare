import 'package:flutter/material.dart';
import '../services/safety_check_service.dart';

class SafetyAlertDialog extends StatelessWidget {
  final SafetyCheckResult safetyResult;
  final VoidCallback? onProceedAnyway;

  const SafetyAlertDialog({
    super.key,
    required this.safetyResult,
    this.onProceedAnyway,
  });

  @override
  Widget build(BuildContext context) {
    final isDanger = safetyResult.severity == SafetySeverity.danger ||
        safetyResult.severity == SafetySeverity.emergency;

    final headerColor = safetyResult.isEmergencyTriggered
        ? Colors.red.shade900
        : (isDanger ? Colors.red.shade700 : Colors.orange.shade800);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      titlePadding: EdgeInsets.zero,
      title: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: headerColor,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
          ),
        ),
        child: Row(
          children: [
            Icon(
              safetyResult.isEmergencyTriggered
                  ? Icons.warning_amber_rounded
                  : Icons.shield_rounded,
              color: Colors.white,
              size: 28,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                safetyResult.isEmergencyTriggered
                    ? "EMERGENCY RED FLAG"
                    : (isDanger ? "CLINICAL SAFETY ALERT" : "SAFETY NOTICE"),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (safetyResult.isEmergencyTriggered) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade300),
                ),
                child: Text(
                  safetyResult.emergencyMessage,
                  style: TextStyle(
                    color: Colors.red.shade900,
                    fontWeight: FontWeight.bold,
                    fontSize: 13.5,
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
            ...safetyResult.warnings.map(
              (warning) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: isDanger ? Colors.red : Colors.orange.shade900,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        warning,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isDanger ? Colors.red.shade900 : Colors.black80,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 24),
            Text(
              SafetyCheckService.disclaimerText,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade700, height: 1.3),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            safetyResult.isEmergencyTriggered ? "Close" : "Cancel",
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        if (onProceedAnyway != null && !safetyResult.isEmergencyTriggered)
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: isDanger ? Colors.red.shade700 : Colors.amber.shade800,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.of(context).pop();
              onProceedAnyway!();
            },
            child: const Text("Acknowledge & Continue"),
          ),
      ],
    );
  }
}
