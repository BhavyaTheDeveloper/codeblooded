import nodemailer from "nodemailer";
import { config } from "../../config/index.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const { host, port, user, pass, secure } = config.email;
  if (!host?.trim() || !user?.trim() || !pass?.trim()) return null;
  transporter = nodemailer.createTransport({
    host,
    port: port ?? 587,
    secure: secure ?? false,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const trans = getTransporter();
  if (!trans) return false;
  try {
    await trans.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html ?? options.text,
    });
    return true;
  } catch {
    return false;
  }
}
