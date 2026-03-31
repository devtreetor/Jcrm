export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  throw new Error(
    `Not implemented — see integration roadmap. Called with phone=${phone}, message=${message}`
  );
}

export async function sendSMS(phone: string, message: string): Promise<void> {
  throw new Error(
    `Not implemented — see integration roadmap. Called with phone=${phone}, message=${message}`
  );
}

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  throw new Error(
    `Not implemented — see integration roadmap. Called with to=${to}, subject=${subject}, body=${body}`
  );
}
