import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Text,
  Preview,
} from '@react-email/components';

const CourseInvitationEmail = ({ courseName, inviterName, acceptUrl }) => (
  <Html>
    <Head />
    <Preview>You're invited to join {courseName}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>You're invited to join {courseName}!</Heading>
        <Text style={paragraph}>Hello,</Text>
        <Text style={paragraph}>
          {inviterName} has invited you to join the course: <strong>{courseName}</strong>.
        </Text>
        <Text style={paragraph}>To accept this invitation, please click the button below:</Text>
        <Button style={button} href={acceptUrl}>
          Join Course
        </Button>
        <Text style={paragraph}>If you did not expect this invitation, you can safely ignore this email.</Text>
        <Text style={paragraph}>
          Best regards,
          <br />
          The Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CourseInvitationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  width: '580px',
  border: '1px solid #eaeaea',
  borderRadius: '5px',
};

const heading = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  textAlign: 'center',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#484848',
  padding: '0 40px',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  padding: '12px',
  margin: '20px 40px',
};