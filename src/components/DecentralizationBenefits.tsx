import { Card, CardContent, Divider, Typography } from "@mui/material";

const DecentralizationBenefits = () => {
    return (
      <Card sx={{ marginTop: 4 }}>
        <CardContent>
          <Typography variant="h5" component="div">
            Benefits of Decentralization
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" paragraph>
            Decentralization offers enhanced security by distributing data across multiple nodes in the network, making it more resilient to attacks and failures.
          </Typography>
          <Typography variant="body1" paragraph>
            With no single point of control, the risk of censorship from centralized authorities is drastically reduced, empowering users to express themselves freely.
          </Typography>
          <Typography variant="body1" paragraph>
            Privacy is significantly improved as personal data is not held by a single entity. Blockchain technology ensures that user data remains private and secure, accessible only by individuals with permission.
          </Typography>
        </CardContent>
      </Card>
    );
  };

export default DecentralizationBenefits;