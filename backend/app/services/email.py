"""
Dridha Crafts - Email Notification Service
Handles automated transactional emails via Gmail SMTP.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from app.config import get_settings

logger = logging.getLogger("dridhacrafts.email")


def mask_email(email: str) -> str:
    """Mask email for privacy-safe logging (e.g. v***a@gmail.com)."""
    if not email or "@" not in email:
        return "masked_user"
    local_part, domain = email.split("@", 1)
    if len(local_part) <= 2:
        masked_local = local_part[0] + "*"
    else:
        masked_local = local_part[0] + "***" + local_part[-1]
    return f"{masked_local}@{domain}"


def _get_smtp_connection():
    """Create and authenticate an SMTP connection."""
    settings = get_settings()
    if not settings.SMTP_PASSWORD:
        return None

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        server.starttls()
        # Clean any whitespace from the 16-letter app password
        clean_password = settings.SMTP_PASSWORD.replace(" ", "").strip()
        server.login(settings.SMTP_USER, clean_password)
        return server
    except Exception as e:
        logger.error("Failed to connect to SMTP server: %s", e)
        return None


def send_order_notification_email(order: Any, items: list[Any]) -> bool:
    """
    Send an instant order alert email to the admin (craftsdridha@gmail.com).
    Also sends an order summary receipt to the customer if customer_email is available.
    """
    settings = get_settings()
    if not settings.SMTP_PASSWORD:
        logger.info("SMTP_PASSWORD is not set. Skipping email dispatch for order %s.", getattr(order, "order_number", "N/A"))
        return False

    server = _get_smtp_connection()
    if not server:
        logger.warning("Could not establish SMTP connection. Email not sent.")
        return False

    try:
        raw_order_num = getattr(order, "order_number", "DC-ORDER")
        raw_customer_name = getattr(order, "shipping_name", "Valued Customer")
        raw_customer_phone = getattr(order, "shipping_phone", "")
        raw_customer_email = getattr(order, "customer_email", "")

        # Sanitize all header inputs to prevent CRLF injection
        order_num = str(raw_order_num).replace("\r", "").replace("\n", "").strip()
        customer_name = str(raw_customer_name).replace("\r", "").replace("\n", "").strip()
        customer_phone = str(raw_customer_phone).replace("\r", "").replace("\n", "").strip()
        customer_email = str(raw_customer_email).replace("\r", "").replace("\n", "").strip()
        total_amount = float(getattr(order, "total", 0.0))

        # Shipping Address formatting
        addr_1 = getattr(order, "shipping_address_line_1", "")
        addr_2 = getattr(order, "shipping_address_line_2", "")
        city = getattr(order, "shipping_city", "")
        state = getattr(order, "shipping_state", "")
        pincode = getattr(order, "shipping_pincode", "")
        full_address = f"{addr_1}{', ' + addr_2 if addr_2 else ''}, {city}, {state} - {pincode}"

        # Line items HTML table rows
        items_html = ""
        items_text = ""
        for item in items:
            name = getattr(item, "product_name", "Item")
            qty = getattr(item, "quantity", 1)
            price = float(getattr(item, "price", 0.0))
            item_total = float(getattr(item, "total", price * qty))
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #E5E0D8;">{name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; text-align: center;">{qty}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; text-align: right;">₹{item_total:,.2f}</td>
            </tr>
            """
            items_text += f"- {name} x{qty} (₹{item_total:,.2f})\n"

        # ── 1. Admin Alert Email ─────────────────────────────────────────────
        admin_subject = f"🚨 [New Order] #{order_num} from {customer_name} (₹{total_amount:,.0f})"
        admin_wa_link = f"https://wa.me/91{customer_phone}" if customer_phone else ""

        admin_html = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; margin: 0; padding: 24px; color: #2A2826;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E5E0D8; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background-color: #1B3B2B; padding: 24px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Dridha Crafts</h1>
                    <p style="margin: 6px 0 0; font-size: 13px; color: #D5C29D; text-transform: uppercase; letter-spacing: 1px;">New Order Received</p>
                </div>
                <div style="padding: 24px;">
                    <div style="background: #F4F1EA; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Order Number:</strong> #{order_num}</p>
                        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Customer:</strong> {customer_name}</p>
                        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Phone:</strong> {customer_phone}</p>
                        {f'<p style="margin: 0 0 8px; font-size: 14px;"><strong>Email:</strong> {customer_email}</p>' if customer_email else ''}
                        <p style="margin: 0; font-size: 14px;"><strong>Delivery Address:</strong> {full_address}</p>
                    </div>

                    <h3 style="margin: 20px 0 10px; font-size: 16px; color: #1B3B2B;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                        <thead>
                            <tr style="background: #FAF8F5; text-align: left; font-size: 12px; text-transform: uppercase; color: #6E6861;">
                                <th style="padding: 10px;">Item</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding: 12px 10px; font-weight: 700; text-align: right;">Grand Total:</td>
                                <td style="padding: 12px 10px; font-weight: 700; font-size: 16px; color: #1B3B2B; text-align: right;">₹{total_amount:,.2f}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="text-align: center; margin-top: 24px;">
                        {f'<a href="{admin_wa_link}" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 8px;">💬 Chat on WhatsApp</a>' if admin_wa_link else ''}
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        msg_admin = MIMEMultipart("alternative")
        msg_admin["Subject"] = admin_subject
        msg_admin["From"] = settings.SMTP_USER
        msg_admin["To"] = settings.ADMIN_NOTIFICATION_EMAIL
        msg_admin.attach(MIMEText(admin_html, "html"))
        server.send_message(msg_admin)
        logger.info("Admin order alert sent for order #%s.", order_num)

        # ── 2. Customer Receipt Email (if customer_email provided) ─────────────
        if customer_email and "@" in customer_email:
            customer_subject = f"Order #{order_num} Received - Dridha Crafts"
            customer_html = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; margin: 0; padding: 24px; color: #2A2826;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E5E0D8; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background-color: #1B3B2B; padding: 28px; text-align: center; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Dridha Crafts</h1>
                        <p style="margin: 6px 0 0; font-size: 13px; color: #D5C29D; text-transform: uppercase; letter-spacing: 1px;">Handmade in the Kashmir Valley</p>
                    </div>
                    <div style="padding: 28px;">
                        <h2 style="font-size: 18px; color: #1B3B2B; margin-top: 0;">Namaste {customer_name},</h2>
                        <p style="font-size: 14px; line-height: 1.6; color: #4A4641;">
                            Thank you for your order with Dridha Crafts! We have received your order <strong>#{order_num}</strong>.
                        </p>
                        <div style="background: #F4F1EA; border-left: 4px solid #1B3B2B; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; font-size: 13px; color: #2A2826; line-height: 1.5;">
                                ⏱ <strong>Payment Verification:</strong> Your wooden pieces are reserved for 48 hours. Please complete your payment via WhatsApp so our artisans can start preparing your package.
                            </p>
                        </div>

                        <h3 style="margin: 20px 0 10px; font-size: 15px; color: #1B3B2B;">Order Details</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                            <tbody>
                                {items_html}
                                <tr>
                                    <td colspan="2" style="padding: 12px 10px; font-weight: 700; text-align: right;">Total (Pan-India Delivery):</td>
                                    <td style="padding: 12px 10px; font-weight: 700; font-size: 16px; color: #1B3B2B; text-align: right;">₹{total_amount:,.2f}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p style="font-size: 14px; line-height: 1.6; color: #4A4641;">
                            <strong>Delivery Address:</strong><br/>
                            {full_address}
                        </p>

                        <div style="text-align: center; margin: 30px 0 10px;">
                            <a href="https://wa.me/{settings.WHATSAPP_NUMBER}" style="display: inline-block; background-color: #1B3B2B; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">Chat on WhatsApp to Complete Payment</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
            msg_customer = MIMEMultipart("alternative")
            msg_customer["Subject"] = customer_subject
            msg_customer["From"] = settings.SMTP_USER
            msg_customer["To"] = customer_email
            msg_customer.attach(MIMEText(customer_html, "html"))
            server.send_message(msg_customer)
            logger.info("Customer order confirmation sent to %s.", mask_email(customer_email))

        return True
    except Exception as e:
        logger.error("Error sending order notification email: %s", e)
        return False
    finally:
        try:
            server.quit()
        except Exception:
            pass
