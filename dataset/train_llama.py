"""
HeartBeat 360 — LLaMA 3.1 8B Instruct Fine-Tuning Pipeline
Fine-tunes meta-llama/Llama-3.1-8B-Instruct on the HeartBeat 360 Medical Education Dataset
using Hugging Face TRL (SFTTrainer), PEFT (QLoRA 4-bit / LoRA), and Transformers.

Usage:
  # Quick training with 4-bit QLoRA on a consumer GPU (16GB+ VRAM, Google Colab T4/A100, Kaggle):
  python dataset/train_llama.py --use_4bit --epochs 3 --batch_size 2 --output_dir ./heartbeat360_llama3_adapter

  # Full FP16/BF16 LoRA training (A100/H100):
  python dataset/train_llama.py --epochs 3 --batch_size 4 --output_dir ./heartbeat360_llama3_adapter
"""

import argparse
import os
import json
import sys


def parse_args():
    parser = argparse.ArgumentParser(
        description="Fine-tune LLaMA 3.1 8B Instruct on the HeartBeat 360 Medical Education Dataset using QLoRA / LoRA."
    )
    parser.add_argument("--model_id", type=str, default="meta-llama/Llama-3.1-8B-Instruct", help="Hugging Face Model ID or local path")
    parser.add_argument("--dataset_path", type=str, default="dataset/heartbeat360_medical_education_dataset.jsonl", help="Path to JSONL dataset")
    parser.add_argument("--output_dir", type=str, default="./heartbeat360_llama3_adapter", help="Directory to save trained LoRA adapters")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Per device train batch size")
    parser.add_argument("--grad_accum", type=int, default=4, help="Gradient accumulation steps")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--max_seq_length", type=int, default=1024, help="Maximum sequence length")
    parser.add_argument("--lora_r", type=int, default=16, help="LoRA rank dimension")
    parser.add_argument("--lora_alpha", type=int, default=32, help="LoRA alpha scaling factor")
    parser.add_argument("--lora_dropout", type=float, default=0.05, help="LoRA dropout rate")
    parser.add_argument("--use_4bit", action="store_true", default=True, help="Enable 4-bit BitsAndBytes QLoRA quantization")
    parser.add_argument("--eval_split", type=float, default=0.1, help="Validation split fraction")
    parser.add_argument("--hf_token", type=str, default=None, help="Hugging Face User Access Token (if not in env)")
    return parser.parse_args()


def format_sharegpt_to_llama3(conversations, tokenizer):
    """
    Formats a ShareGPT conversation into standard LLaMA 3.1 Instruct Chat Template:
    <|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|>
    <|start_header_id|>user<|end_header_id|>\n\n{user_message}<|eot_id|>
    <|start_header_id|>assistant<|end_header_id|>\n\n{assistant_response}<|eot_id|>
    """
    messages = []
    for turn in conversations:
        role = turn.get("from")
        content = turn.get("value", "")

        if role == "system":
            messages.append({"role": "system", "content": content})
        elif role in ("human", "user"):
            messages.append({"role": "user", "content": content})
        elif role in ("gpt", "assistant"):
            messages.append({"role": "assistant", "content": content})

    if hasattr(tokenizer, "apply_chat_template"):
        try:
            return tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
        except Exception:
            pass

    # Standard Fallback LLaMA 3.1 template
    formatted = "<|begin_of_text|>"
    for msg in messages:
        formatted += f"<|start_header_id|>{msg['role']}<|end_header_id|>\n\n{msg['content']}<|eot_id|>"
    return formatted


def load_and_prepare_dataset(jsonl_path, tokenizer, eval_split=0.1):
    """Loads and formats the JSONL dataset into Hugging Face Dataset format."""
    try:
        from datasets import Dataset
    except ImportError:
        print("[ERROR] 'datasets' library is required. Install with: pip install datasets")
        sys.exit(1)

    print(f"Loading dataset from: {jsonl_path}")
    raw_entries = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                raw_entries.append(json.loads(line.strip()))

    formatted_texts = []
    for entry in raw_entries:
        convs = entry.get("conversations", [])
        text = format_sharegpt_to_llama3(convs, tokenizer)
        formatted_texts.append({"text": text})

    dataset = Dataset.from_list(formatted_texts)
    split_dataset = dataset.train_test_split(test_size=eval_split, seed=42)
    print(f"Dataset split: {len(split_dataset['train'])} train examples, {len(split_dataset['test'])} validation examples")
    return split_dataset


def main():
    args = parse_args()

    try:
        import torch
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            BitsAndBytesConfig,
            TrainingArguments,
        )
        from peft import (
            LoraConfig,
            get_peft_model,
            prepare_model_for_kbit_training,
            TaskType,
        )
    except ImportError as e:
        print(f"[ERROR] Required ML dependencies missing: {e}")
        print("Please install requirements with:")
        print("  pip install torch transformers peft trl bitsandbytes datasets accelerate")
        sys.exit(1)

    try:
        from trl import SFTTrainer
    except ImportError:
        SFTTrainer = None

    token = args.hf_token or os.getenv("HF_TOKEN") or os.getenv("HF_API_TOKEN")

    print("=" * 65)
    print(" HEARTBEAT 360 — LLAMA 3.1 INSTRUCT FINE-TUNING PIPELINE")
    print("=" * 65)
    print(f"Base Model: {args.model_id}")
    print(f"Dataset: {args.dataset_path}")
    print(f"Output Directory: {args.output_dir}")
    print(f"Quantization: {'4-bit QLoRA' if args.use_4bit else 'Full Precision / 16-bit'}")
    print(f"LoRA Rank (r): {args.lora_r}, Alpha: {args.lora_alpha}")
    print(f"Epochs: {args.epochs}, Batch Size: {args.batch_size}, Grad Accum: {args.grad_accum}")
    print("-" * 65)

    # 1. Tokenizer
    print("Loading Tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        args.model_id,
        token=token,
        trust_remote_code=True,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # 2. Dataset
    dataset = load_and_prepare_dataset(args.dataset_path, tokenizer, args.eval_split)

    # 3. Quantization Config (QLoRA)
    bnb_config = None
    if args.use_4bit and torch.cuda.is_available():
        print("Configuring 4-bit BitsAndBytes Quantization (NF4)...")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
            bnb_4bit_use_double_quant=True,
        )

    # 4. Load Base Model
    device_map = "auto" if torch.cuda.is_available() else None
    print(f"Loading Base Model on device: {'CUDA' if torch.cuda.is_available() else 'CPU'}...")
    model = AutoModelForCausalLM.from_pretrained(
        args.model_id,
        quantization_config=bnb_config,
        device_map=device_map,
        token=token,
        trust_remote_code=True,
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float32,
    )

    if args.use_4bit and torch.cuda.is_available():
        model = prepare_model_for_kbit_training(model)

    # 5. LoRA Configuration
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        bias="none",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # 6. Training Arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        lr_scheduler_type="cosine",
        warmup_ratio=0.05,
        logging_steps=10,
        eval_strategy="epoch" if args.eval_split > 0 else "no",
        save_strategy="epoch",
        fp16=torch.cuda.is_available() and not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_available() and torch.cuda.is_bf16_supported(),
        max_grad_norm=0.3,
        weight_decay=0.01,
        save_total_limit=2,
        report_to="none",
    )

    # 7. SFT Trainer Setup
    print("Initializing Supervised Fine-Tuning (SFT) Trainer...")
    if SFTTrainer is not None:
        trainer = SFTTrainer(
            model=model,
            train_dataset=dataset["train"],
            eval_dataset=dataset["test"] if args.eval_split > 0 else None,
            peft_config=lora_config,
            dataset_text_field="text",
            max_seq_length=args.max_seq_length,
            tokenizer=tokenizer,
            args=training_args,
        )
    else:
        print("TRL not found, falling back to standard Trainer...")
        from transformers import Trainer, DataCollatorForLanguageModeling
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=dataset["train"],
            eval_dataset=dataset["test"] if args.eval_split > 0 else None,
            data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
        )

    # 8. Train
    print("Starting Model Training...")
    trainer.train()

    # 9. Save Trained LoRA Adapter & Tokenizer
    print(f"Saving final trained model weights to: {args.output_dir}")
    trainer.model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    print("=" * 65)
    print("✅ FINE-TUNING COMPLETED SUCCESSFULLY!")
    print(f"LoRA Adapter saved at: {os.path.abspath(args.output_dir)}")
    print("You can now load this adapter in Hugging Face Inference or FastAPI backend.")
    print("=" * 65)


if __name__ == "__main__":
    main()
