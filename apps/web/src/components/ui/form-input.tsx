"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  as?: "input" | "textarea" | "select";
  options?: { value: string; label: string }[];
  className?: string;
}

export function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  as = "input",
  options,
  className,
}: FormInputProps) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  const hasValue = value.length > 0;
  const isFloating = focused || hasValue;

  const baseClasses = clsx(
    "w-full bg-transparent font-body text-body text-foreground",
    "border-0 border-b border-border focus:border-foreground",
    "outline-none transition-colors duration-300",
    "pt-6 pb-2 px-0",
    className
  );

  return (
    <div className="relative w-full">
      <AnimatePresence>
        <motion.label
          htmlFor={id}
          className={clsx(
            "absolute left-0 font-body text-muted pointer-events-none origin-left",
            isFloating ? "text-[11px] uppercase tracking-wide" : "text-body"
          )}
          initial={false}
          animate={{
            y: isFloating ? 0 : 24,
            scale: isFloating ? 1 : 1,
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {label}
          {required && <span className="text-muted ml-0.5">*</span>}
        </motion.label>
      </AnimatePresence>

      {as === "textarea" ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={focused ? placeholder : undefined}
          required={required}
          rows={4}
          className={clsx(baseClasses, "resize-none")}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      ) : as === "select" ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={clsx(baseClasses, "appearance-none cursor-pointer")}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <option value="" disabled hidden />
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card">
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={focused ? placeholder : undefined}
          required={required}
          className={baseClasses}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
    </div>
  );
}
