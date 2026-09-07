import 'package:flutter/material.dart';

class EmergencyScreen extends StatelessWidget {
  const EmergencyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("EMERGENCY HELP & FIRST-AID", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.red.shade900,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Prominent Call Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.red.shade700,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 3))],
              ),
              child: Column(
                children: [
                  const Icon(Icons.emergency, color: Colors.white, size: 48),
                  const SizedBox(height: 8),
                  const Text(
                    "LIFE-THREATENING EMERGENCY?",
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    "If someone is unconscious, severely bleeding, or experiencing chest pain, call emergency services immediately.",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.red.shade900,
                      minimumSize: const Size.fromHeight(48),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Initiating call to Emergency Medical Hotline (911 / 112 / 102)...")),
                      );
                    },
                    icon: const Icon(Icons.phone_in_talk, size: 22),
                    label: const Text("CALL EMERGENCY HOTLINE (112 / 911)", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text("Quick First-Aid Protocols", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
            const SizedBox(height: 12),

            _buildFirstAidCard(
              "Chest Pain / Suspected Cardiac Event",
              "1. Have the person sit down and rest calmly.\n2. Loosen tight clothing around neck and waist.\n3. Call emergency hotline immediately.\n4. If aspirin is approved and available, chewed low-dose aspirin may be taken under guidance.",
              Icons.favorite,
              Colors.red.shade100,
              Colors.red.shade900,
            ),
            _buildFirstAidCard(
              "Severe Bleeding",
              "1. Apply direct firm pressure with a clean cloth or sterile bandage.\n2. Maintain continuous pressure without lifting towel.\n3. Elevate injured limb above heart level if no fracture is suspected.\n4. Seek immediate emergency room transport.",
              Icons.bloodtype,
              Colors.red.shade50,
              Colors.red.shade800,
            ),
            _buildFirstAidCard(
              "Choking & Airway Obstruction",
              "1. Stand behind the person and lean them slightly forward.\n2. Perform 5 back blows between shoulder blades with heel of hand.\n3. Perform 5 quick abdominal thrusts (Heimlich maneuver).\n4. Repeat until obstruction clears or medical help arrives.",
              Icons.air,
              Colors.blue.shade50,
              Colors.blue.shade900,
            ),
            _buildFirstAidCard(
              "Severe Burns",
              "1. Cool the burn under cool running tap water for at least 10–20 minutes.\n2. Do NOT apply ice, butter, or ointments directly.\n3. Cover loosely with sterile non-stick film or clean cloth.",
              Icons.local_fire_department,
              Colors.orange.shade50,
              Colors.orange.shade900,
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildFirstAidCard(String title, String instructions, IconData icon, Color bgColor, Color iconColor) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: bgColor,
              child: Icon(icon, color: iconColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: iconColor)),
                  const SizedBox(height: 6),
                  Text(instructions, style: const TextStyle(fontSize: 13, height: 1.4, color: Colors.black87)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
