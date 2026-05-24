from app.core.mail import send_email


async def send_otp_email(to: str, code: str) -> None:
    await send_email(
        to=to,
        subject="Votre code de connexion",
        body=f"Votre code OTP est : {code}\n\nIl expire dans 5 minutes.",
    )
