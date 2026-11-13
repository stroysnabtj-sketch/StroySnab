# Payom contact code delivery

Registration, code login and password reset share `sendContactCode`. Payom requires approved templates for this account, but the adapter still sent free text. It now sends `templateMessage.templateId` from `AUTH_SMS_TEMPLATE_ID` and the code as a string variable, preserving leading zeroes. Missing template configuration fails before any paid request.

Successful HTTP 201 responses support both JSON string message IDs and object IDs. Empty IDs and non-success responses fail closed. No OTP, token or provider response is logged.

Production configuration: `AUTH_SMS_TEMPLATE_ID=6c09ead9-41bc-434e-a05b-fd5180d1f882`, sender `StroySnab`. One previously authorized test SMS was accepted (201) and the user confirmed receipt. No additional paid test was sent.

Operational order notifications remain a separate worker/transport; their template integration and activation are not part of this contact-code fix.

Validation: four adapter tests cover template payload, leading zeroes, missing configuration, rejection and string ID responses. ESLint and production build are checked before deployment.
