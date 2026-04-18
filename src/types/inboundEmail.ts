export interface InboundAttachment {
  Name?: string;
  ContentType?: string;
  Content?: string;
}

export interface InboundEmailPayload {
  From?: string;
  Subject?: string;
  TextBody?: string;
  HtmlBody?: string;
  Attachments?: InboundAttachment[];
}

export interface ProcessedImage {
  filename: string;
  buffer: Buffer;
}
