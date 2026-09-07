import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../../providers/app_providers.dart';
import '../../services/safety_check_service.dart';
import '../../widgets/disclaimer_banner.dart';
import '../emergency/emergency_screen.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final SafetyCheckResult? safetyResult;

  ChatMessage({required this.text, required this.isUser, this.safetyResult});
}

class ChatSession {
  final String id;
  String title;
  final DateTime timestamp;
  final List<ChatMessage> messages;

  ChatSession({
    required this.id,
    required this.title,
    required this.timestamp,
    required this.messages,
  });
}

class AskAssistantScreen extends ConsumerStatefulWidget {
  const AskAssistantScreen({super.key});

  @override
  ConsumerState<AskAssistantScreen> createState() => _AskAssistantScreenState();
}

class _AskAssistantScreenState extends ConsumerState<AskAssistantScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<ChatMessage> _messages = [];
  final List<ChatSession> _sessions = [];
  String _activeSessionId = '';
  late stt.SpeechToText _speech;
  bool _isListening = false;

  static const String _defaultGreeting =
      "Hello! I am Dr. HeartBeat, your Senior Medical Consultant. How are you feeling today? You can type or press the microphone to share your symptoms or questions.";

  @override
  void initState() {
    super.initState();
    _speech = stt.SpeechToText();
    _startNewSession();
  }

  void _startNewSession() {
    setState(() {
      _activeSessionId = 'session_${DateTime.now().millisecondsSinceEpoch}';
      _messages.clear();
      _messages.add(ChatMessage(
        text: _defaultGreeting,
        isUser: false,
      ));
    });
  }

  void _saveCurrentSession() {
    if (_messages.length <= 1) return;

    final firstUserMsg = _messages.firstWhere(
      (m) => m.isUser,
      orElse: () => ChatMessage(text: "Consultation", isUser: true),
    );

    final title = firstUserMsg.text.length > 32
        ? "${firstUserMsg.text.substring(0, 32)}..."
        : firstUserMsg.text;

    final existingIdx = _sessions.indexWhere((s) => s.id == _activeSessionId);
    if (existingIdx >= 0) {
      _sessions[existingIdx] = ChatSession(
        id: _activeSessionId,
        title: _sessions[existingIdx].title,
        timestamp: DateTime.now(),
        messages: List.from(_messages),
      );
    } else {
      _sessions.insert(
        0,
        ChatSession(
          id: _activeSessionId,
          title: title,
          timestamp: DateTime.now(),
          messages: List.from(_messages),
        ),
      );
    }
  }

  void _loadSession(ChatSession session) {
    setState(() {
      _activeSessionId = session.id;
      _messages.clear();
      _messages.addAll(session.messages);
    });
    Navigator.pop(context);
  }

  void _deleteSession(String sessionId) {
    setState(() {
      _sessions.removeWhere((s) => s.id == sessionId);
      if (_activeSessionId == sessionId) {
        if (_sessions.isNotEmpty) {
          _activeSessionId = _sessions.first.id;
          _messages.clear();
          _messages.addAll(_sessions.first.messages);
        } else {
          _startNewSession();
        }
      }
    });
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Consultation deleted"),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _clearAllHistory() {
    setState(() {
      _sessions.clear();
      _startNewSession();
    });
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("All chat history cleared"),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _showHistorySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.65,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.history, color: Colors.teal.shade800),
                      const SizedBox(width: 8),
                      const Text(
                        "Consultation History",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _startNewSession();
                    },
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text("New Chat"),
                    style: TextButton.styleFrom(foregroundColor: Colors.teal.shade800),
                  ),
                  if (_sessions.isNotEmpty)
                    TextButton.icon(
                      onPressed: _clearAllHistory,
                      icon: const Icon(Icons.delete_sweep, size: 18, color: Colors.red),
                      label: const Text("Clear All", style: TextStyle(color: Colors.red)),
                    ),
                ],
              ),
              const Divider(),
              Expanded(
                child: _sessions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.chat_bubble_outline, size: 48, color: Colors.grey.shade400),
                            const SizedBox(height: 8),
                            Text(
                              "No past consultations saved yet.",
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: _sessions.length,
                        itemBuilder: (c, idx) {
                          final session = _sessions[idx];
                          final isActive = session.id == _activeSessionId;

                          return Card(
                            elevation: isActive ? 2 : 0,
                            color: isActive ? Colors.teal.shade50 : Colors.grey.shade50,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(
                                color: isActive ? Colors.teal.shade600 : Colors.grey.shade300,
                              ),
                            ),
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: isActive ? Colors.teal.shade700 : Colors.grey.shade300,
                                foregroundColor: Colors.white,
                                child: const Icon(Icons.medical_services, size: 18),
                              ),
                              title: Text(
                                session.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                              subtitle: Text(
                                "${session.messages.length} messages • ${session.timestamp.hour}:${session.timestamp.minute.toString().padLeft(2, '0')}",
                                style: const TextStyle(fontSize: 12),
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                                tooltip: "Delete conversation",
                                onPressed: () => _deleteSession(session.id),
                              ),
                              onTap: () => _loadSession(session),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _listenVoice() async {
    if (!_isListening) {
      bool available = await _speech.initialize(
        onStatus: (val) => debugPrint('onStatus: $val'),
        onError: (val) => debugPrint('onError: $val'),
      );
      if (available) {
        setState(() => _isListening = true);
        _speech.listen(
          onResult: (val) {
            setState(() {
              _controller.text = val.recognizedWords;
            });
          },
        );
      }
    } else {
      setState(() => _isListening = false);
      _speech.stop();
    }
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    _controller.clear();
    setState(() {
      _messages.add(ChatMessage(text: text, isUser: true));
    });

    // 1. Safety Check Evaluation for Emergency Keywords
    final safetyResult = SafetyCheckService.evaluateSymptoms(text);

    String assistantReply = "";
    if (safetyResult.isEmergencyTriggered) {
      assistantReply =
          "CRITICAL SAFETY ALERT: Your symptoms match medical emergency criteria. Please review the red emergency banner below and seek immediate emergency care!";
    } else {
      assistantReply =
          "Thank you for sharing. Based on our clinical reference dataset, if your symptoms relate to routine health Q&A or medication questions, please consult the relevant Medical Specialty module or book a doctor consultation. Note: This assistant provides informational guidance only and is not a medical diagnosis.";
    }

    setState(() {
      _messages.add(ChatMessage(
        text: assistantReply,
        isUser: false,
        safetyResult: safetyResult,
      ));
      _saveCurrentSession();
    });
  }

  void _exitChatbot() {
    _saveCurrentSession();
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Ask Assistant (Text / Voice)", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.teal.shade800,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: "Chat History",
            onPressed: _showHistorySheet,
          ),
          IconButton(
            icon: const Icon(Icons.close),
            tooltip: "Exit Chatbot",
            onPressed: _exitChatbot,
          ),
        ],
      ),
      body: Column(
        children: [
          const DisclaimerBanner(compact: true),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _messages.length,
              itemBuilder: (context, idx) {
                final msg = _messages[idx];
                final isEmergency = msg.safetyResult?.isEmergencyTriggered ?? false;

                return Align(
                  alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    maxWidth: MediaQuery.of(context).size.width * 0.82,
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: msg.isUser
                          ? Colors.teal.shade700
                          : (isEmergency ? Colors.red.shade50 : Colors.grey.shade100),
                      borderRadius: BorderRadius.circular(16),
                      border: isEmergency ? Border.all(color: Colors.red.shade400, width: 1.5) : null,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (isEmergency) ...[
                          Row(
                            children: [
                              Icon(Icons.warning, color: Colors.red.shade900, size: 22),
                              const SizedBox(width: 6),
                              Text(
                                "EMERGENCY WARNING",
                                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red.shade900),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                        ],
                        Text(
                          msg.text,
                          style: TextStyle(
                            color: msg.isUser
                                ? Colors.white
                                : (isEmergency ? Colors.red.shade950 : Colors.black87),
                            fontSize: 14,
                            height: 1.3,
                          ),
                        ),
                        if (isEmergency) ...[
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red.shade800,
                                foregroundColor: Colors.white,
                              ),
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (ctx) => const EmergencyScreen()),
                                );
                              },
                              icon: const Icon(Icons.emergency),
                              label: const Text("Open Emergency First-Aid & Helpline"),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8.0),
            color: Colors.white,
            child: Row(
              children: [
                IconButton(
                  icon: Icon(_isListening ? Icons.mic : Icons.mic_none, color: _isListening ? Colors.red : Colors.teal),
                  onPressed: _listenVoice,
                ),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: "Type symptoms or health question...",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Colors.teal.shade800,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white, size: 20),
                    onPressed: _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
