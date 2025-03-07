# Deployment Guide for NGINX, PeerJS, Coturn with HTTPS

This guide will walk you through deploying the Terraform configuration to set up NGINX, PeerJS, Coturn, and obtain a free HTTPS certificate from Let's Encrypt on your Ubuntu 24.10 server.

## Prerequisites

1. **Terraform installed** on your local machine
   - Download from [Terraform's website](https://www.terraform.io/downloads.html)
   - Verify installation: `terraform -v`

2. **SSH access** to your Ubuntu 24.10 server
   - Ensure you have SSH keys set up for passwordless authentication
   - Test connection: `ssh root@gpbrawl.duckdns.org`

3. **Domain pointing to your server**
   - Ensure that gpbrawl.duckdns.org is pointing to your server's IP address
   - You can verify this with: `ping gpbrawl.duckdns.org`

## Deployment Steps

1. **Create a project directory** on your local machine:
   ```bash
   mkdir terraform-webrtc-server
   cd terraform-webrtc-server
   ```

2. **Create the main.tf file** with the Terraform configuration provided in the artifact.

3. **Create a terraform.tfvars file** to set your email for Let's Encrypt:
   ```bash
   cat > terraform.tfvars << 'EOL'
   email = "your-email@example.com"  # Replace with your actual email
   EOL
   ```

4. **Initialize Terraform:**
   ```bash
   terraform init
   ```

5. **Preview the changes** that will be applied:
   ```bash
   terraform plan
   ```

6. **Apply the configuration:**
   ```bash
   terraform apply
   ```
   - When prompted, type `yes` to confirm the deployment

7. **Wait for completion**
   - The process may take several minutes to complete
   - Terraform will output "Setup completed successfully" when done

## Verification

1. **Visit your domain in a web browser:**
   ```
   https://gpbrawl.duckdns.org
   ```
   - You should see the test page confirming your setup

2. **Check service status:**
   ```bash
   ssh root@gpbrawl.duckdns.org
   systemctl status nginx
   systemctl status coturn
   systemctl status peerjs
   ```

3. **Test HTTPS certificate:**
   ```bash
   curl -I https://gpbrawl.duckdns.org
   ```
   - Look for "HTTP/2 200" in the response

## Configuration Details

- **NGINX:** Configured to serve static content and proxy WebSocket connections to PeerJS
- **PeerJS:** Running as a systemd service on port 9000
- **Coturn:** Configured as a TURN server for WebRTC with the following credentials:
  - Username: webrtcuser
  - Password: webrtcpassword
- **HTTPS:** Managed by Let's Encrypt with automatic renewal via certbot

## Making Changes

To update your configuration:

1. Edit the Terraform files
2. Run `terraform apply` to apply the changes

## Security Considerations

- **Change default credentials:** Update the hardcoded Coturn credentials in the configuration
- **Firewall configuration:** Ensure your firewall allows traffic on ports 80, 443, 3478, 5349
- **Regular updates:** Keep your system updated with `apt update && apt upgrade`

## Troubleshooting

If you encounter issues:

1. **Check logs:**
   ```bash
   journalctl -u nginx
   journalctl -u coturn
   journalctl -u peerjs
   ```

2. **Verify port availability:**
   ```bash
   ss -tulpn | grep -E '80|443|3478|5349|9000'
   ```

3. **Test TURN server:**
   ```bash
   turnutils_uclient -v -t -T -u webrtcuser -w webrtcpassword gpbrawl.duckdns.org
   ```
