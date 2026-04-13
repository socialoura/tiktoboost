import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { OrderPayload } from "@/lib/types";

interface OrderConfirmationEmailProps {
  order: OrderPayload;
}

export default function OrderConfirmationEmail({
  order,
}: OrderConfirmationEmailProps) {
  const {
    orderId,
    username,
    platform,
    service,
    quantity,
    price,
    currency = "EUR",
  } = order;

  const platformLabel = "TikTok";
  const platformColor = "#010101";
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(price);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Html>
      <Head />
      <Preview>
        Order Confirmed — {quantity} {platformLabel} {service} for @{username}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient */}
          <Section style={header}>
            <Img
              src="https://reachopia.com/logo.png"
              width="180"
              height="48"
              alt="Reachopia"
              style={{ margin: "0 auto" }}
            />
          </Section>

          {/* Success badge */}
          <Section style={successSection}>
            <div style={checkCircle}>✓</div>
            <Heading style={successHeading}>Order Confirmed!</Heading>
            <Text style={successText}>
              Thank you for your purchase. Your order is being processed and
              delivery will begin shortly.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Order Details */}
          <Section style={detailsSection}>
            <Heading as="h2" style={sectionTitle}>
              Order Details
            </Heading>

            <Section style={orderCard}>
              <Row>
                <Column style={labelCol}>Order Number</Column>
                <Column style={valueCol}>
                  <Text style={valueBold}>#{orderId}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={labelCol}>Date</Column>
                <Column style={valueCol}>
                  <Text style={valueText}>{date}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={labelCol}>Platform</Column>
                <Column style={valueCol}>
                  <Text style={{ ...valueBold, color: platformColor }}>
                    {platformLabel}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column style={labelCol}>Service</Column>
                <Column style={valueCol}>
                  <Text style={valueText}>{service}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={labelCol}>Quantity</Column>
                <Column style={valueCol}>
                  <Text style={valueText}>{quantity} Followers</Text>
                </Column>
              </Row>
              <Row>
                <Column style={labelCol}>Username</Column>
                <Column style={valueCol}>
                  <Text style={valueBold}>@{username}</Text>
                </Column>
              </Row>
            </Section>

            {/* Total */}
            <Section style={totalSection}>
              <Row>
                <Column style={totalLabel}>Total Paid</Column>
                <Column style={totalValue}>
                  <Text style={totalPrice}>{formattedPrice}</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Delivery info */}
          <Section style={infoSection}>
            <Heading as="h2" style={sectionTitle}>
              What Happens Next?
            </Heading>
            <div style={stepRow}>
              <div style={stepNumber}>1</div>
              <Text style={stepText}>
                Your order is being verified and processed by our system.
              </Text>
            </div>
            <div style={stepRow}>
              <div style={stepNumber}>2</div>
              <Text style={stepText}>
                Delivery begins within minutes — followers are added gradually
                for natural growth.
              </Text>
            </div>
            <div style={stepRow}>
              <div style={stepNumber}>3</div>
              <Text style={stepText}>
                Full delivery completes within 24–72 hours depending on package
                size.
              </Text>
            </div>
          </Section>

          <Hr style={divider} />

          {/* Track Order CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              Want to follow the progress of your campaign in real time?
            </Text>
            <Link
              href={`https://reachopia.com/dashboard?email=${encodeURIComponent(order.email || "")}`}
              style={trackButton}
            >
              Track Your Order →
            </Link>
          </Section>

          <Hr style={divider} />

          {/* Support CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              Need help? Our support team is available 24/7.
            </Text>
            <Link href="mailto:reachopia@gmail.com" style={ctaButton}>
              Contact Support
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Reachopia. All rights reserved.
            </Text>
            <Text style={footerSmall}>
              This email was sent to confirm your order. If you did not make this
              purchase, please contact our support team immediately.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ──────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "580px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
};

const header: React.CSSProperties = {
  background: "linear-gradient(135deg, #c13584 0%, #e1306c 50%, #ff0000 100%)",
  padding: "32px 40px",
  textAlign: "center" as const,
};

const successSection: React.CSSProperties = {
  padding: "32px 40px 16px",
  textAlign: "center" as const,
};

const checkCircle: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  backgroundColor: "#dcfce7",
  color: "#16a34a",
  fontSize: "28px",
  lineHeight: "56px",
  textAlign: "center" as const,
  margin: "0 auto 16px",
  fontWeight: "bold",
};

const successHeading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#2d2d2d",
  margin: "0 0 8px",
};

const successText: React.CSSProperties = {
  fontSize: "14px",
  color: "#535353",
  lineHeight: "1.6",
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#e5e5e5",
  margin: "0 40px",
};

const detailsSection: React.CSSProperties = {
  padding: "24px 40px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#2d2d2d",
  margin: "0 0 16px",
};

const orderCard: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "12px",
  padding: "20px",
};

const labelCol: React.CSSProperties = {
  fontSize: "13px",
  color: "#535353",
  padding: "6px 0",
  width: "40%",
  verticalAlign: "top",
};

const valueCol: React.CSSProperties = {
  padding: "6px 0",
  width: "60%",
  textAlign: "right" as const,
  verticalAlign: "top",
};

const valueText: React.CSSProperties = {
  fontSize: "13px",
  color: "#2d2d2d",
  margin: "0",
};

const valueBold: React.CSSProperties = {
  fontSize: "13px",
  color: "#2d2d2d",
  fontWeight: "600",
  margin: "0",
};

const totalSection: React.CSSProperties = {
  background: "linear-gradient(135deg, #c13584 0%, #e1306c 50%, #ff0000 100%)",
  borderRadius: "12px",
  padding: "16px 20px",
  marginTop: "12px",
};

const totalLabel: React.CSSProperties = {
  fontSize: "14px",
  color: "#ffffff",
  fontWeight: "600",
  padding: "0",
  verticalAlign: "middle",
};

const totalValue: React.CSSProperties = {
  textAlign: "right" as const,
  padding: "0",
  verticalAlign: "middle",
};

const totalPrice: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#ffffff",
  margin: "0",
};

const infoSection: React.CSSProperties = {
  padding: "24px 40px",
};

const stepRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "12px",
};

const stepNumber: React.CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  backgroundColor: "#c13584",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "700",
  lineHeight: "28px",
  textAlign: "center" as const,
  flexShrink: 0,
};

const stepText: React.CSSProperties = {
  fontSize: "13px",
  color: "#535353",
  lineHeight: "1.6",
  margin: "2px 0 0",
};

const ctaSection: React.CSSProperties = {
  padding: "24px 40px",
  textAlign: "center" as const,
};

const ctaText: React.CSSProperties = {
  fontSize: "14px",
  color: "#535353",
  margin: "0 0 16px",
};

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 32px",
  backgroundColor: "#c13584",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  borderRadius: "999px",
  textDecoration: "none",
};

const trackButton: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 36px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  borderRadius: "999px",
  textDecoration: "none",
};

const footer: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  padding: "24px 40px",
  textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
  fontSize: "13px",
  color: "#535353",
  margin: "0 0 4px",
};

const footerSmall: React.CSSProperties = {
  fontSize: "11px",
  color: "#9ca3af",
  lineHeight: "1.5",
  margin: "0",
};
