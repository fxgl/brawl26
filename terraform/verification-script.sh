#!/bin/bash
# Service verification script for NGINX, PeerJS and Coturn setup
# Run this on your server after applying the Terraform configuration

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Print header
echo -e "${BOLD}WebRTC Server Configuration Verification${NC}"
echo "=================================="
echo

# Check if services are running
echo -e "${BOLD}Service Status:${NC}"

# Check NGINX
if systemctl is-active --quiet nginx; then
    echo -e "NGINX: ${GREEN}Running${NC}"
    # Check if site is enabled
    if [ -f /etc/nginx/sites-enabled/gpbrawl.duckdns.org ]; then
        echo -e "  - Site configuration: ${GREEN}Found${NC}"
    else
        echo -e "  - Site configuration: ${RED}Not found${NC}"
    fi
else
    echo -e "NGINX: ${RED}Not running${NC}"
fi

# Check Coturn
if systemctl is-active --quiet coturn; then
    echo -e "Coturn: ${GREEN}Running${NC}"
    # Check configuration
    if grep -q "realm=gpbrawl.duckdns.org" /etc/turnserver.conf; then
        echo -e "  - Configuration: ${GREEN}Valid${NC}"
    else
        echo -e "  - Configuration: ${YELLOW}May need review${NC}"
    fi
else
    echo -e "Coturn: ${RED}Not running${NC}"
fi

# Check PeerJS
if systemctl is-active --quiet peerjs; then
    echo -e "PeerJS: ${GREEN}Running${NC}"
else
    echo -e "PeerJS: ${RED}Not running${NC}"
fi

echo

# Check ports
echo -e "${BOLD}Port Availability:${NC}"
echo "Checking if required ports are open and listening..."

# Function to check port
check_port() {
    local port=$1
    local service=$2
    if ss -tuln | grep -q ":$port "; then
        echo -e "Port $port ($service): ${GREEN}Listening${NC}"
    else
        echo -e "Port $port ($service): ${RED}Not listening${NC}"
    fi
}

check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3478 "TURN/UDP"
check_port 5349 "TURN/TLS"
check_port 9000 "PeerJS"

echo

# Check SSL certificate
echo -e "${BOLD}SSL Certificate:${NC}"
if [ -d /etc/letsencrypt/live/gpbrawl.duckdns.org ]; then
    echo -e "Let's Encrypt certificate: ${GREEN}Installed${NC}"
    # Check expiration
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/gpbrawl.duckdns.org/cert.pem | cut -d= -f2)
    echo -e "  - Expires: $CERT_EXPIRY"
    
    # Calculate days until expiry
    EXPIRY_DATE=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_DATE=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_DATE - $CURRENT_DATE) / 86400 ))
    
    if [ $DAYS_LEFT -lt 10 ]; then
        echo -e "  - Status: ${RED}Expiring soon ($DAYS_LEFT days)${NC}"
    else
        echo -e "  - Status: ${GREEN}Valid ($DAYS_LEFT days remaining)${NC}"
    fi
else
    echo -e "Let's Encrypt certificate: ${RED}Not installed${NC}"
fi

echo

# System resources
echo -e "${BOLD}System Resources:${NC}"
echo -e "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo -e "Memory Usage: $(free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2}')"
echo -e "Disk Usage: $(df -h / | awk 'NR==2{print $5}')"

echo
echo -e "${BOLD}Verification complete!${NC}"
echo "For detailed logs, check journalctl -u [service-name]"
