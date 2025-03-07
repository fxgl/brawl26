# main.tf
terraform {
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0.0"
    }
  }
  required_version = ">= 1.0.0"
}

provider "null" {}
provider "tls" {}

# SSH connection configuration
variable "host" {
  description = "The hostname of the server"
  default     = "brawl.positrondynamics.tech"
}

variable "ssh_user" {
  description = "SSH username"
  default     = "root"
}

variable "domain_name" {
  description = "Domain name for the server"
  default     = "brawl.positrondynamics.tech"
}

variable "email" {
  description = "Email address for Let's Encrypt certificate"
  type        = string
}

# Install required packages
resource "null_resource" "install_packages" {
  connection {
    type        = "ssh"
    user        = var.ssh_user
    host        = var.host
    agent       = true
    private_key = file("~/.ssh/id_rsa")
  }

  provisioner "remote-exec" {
    inline = [
      "apt-get update",
      "apt-get install -y nginx certbot python3-certbot-nginx coturn nodejs npm",
      "systemctl enable nginx",
      "systemctl start nginx",
      "systemctl enable coturn"
    ]
  }
}

# Configure NGINX
resource "null_resource" "configure_nginx" {
  depends_on = [null_resource.install_packages]

   connection {
      type        = "ssh"
      user        = var.ssh_user
      host        = var.host
      agent       = true
      private_key = file("~/.ssh/id_rsa")
    }

  provisioner "file" {
    content     = <<-EOT
    server {
        listen 80;
        server_name <WEB_NAME>.example.com;
        return 301 https://$host$request_uri;
    }

      server {
          listen 443 ssl;
          server_name ${var.domain_name};
          ssl_certificate /etc/letsencrypt/live/${var.domain_name}/fullchain.pem;
           ssl_certificate_key /etc/letsencrypt/live/${var.domain_name}/privkey.pem;
          
          # Set proper MIME types for compressed files
          gzip_static on;
          gunzip on;
          
          # Add proper MIME types for compressed files
          types {
              application/javascript js;
              text/css css;
              text/html html htm;
              text/plain txt;
              application/json json;
              image/svg+xml svg svgz;
              application/x-font-ttf ttf;
              application/x-font-opentype otf;
              application/font-woff woff;
              application/font-woff2 woff2;
          }
          

            
          location / {
              root /var/www/html;
              index index.html;
              gzip_static on;
                
              location ~ \.js\.gz$ {
                    gzip_static off;
                    proxy_set_header Content-Type application/javascript;
                    add_header Content-Encoding gzip;
                 }
                location ~ \.wasm\.gz$ {
                    gzip off;
                    
                    # Ensure the correct MIME type for WebAssembly
                    default_type application/wasm;
                
                    # Remove conflicting headers
                    proxy_hide_header Cache-Control;
                    proxy_hide_header Expires;
                
                    # Set correct headers
                    add_header Content-Encoding gzip always;
                    add_header Cache-Control "public, no-transform, max-age=60" always;
                }
            location ~ \.data\.gz$ {
                                gzip off;
                                
                                # Ensure the correct MIME type for WebAssembly
                                default_type application/data;
                            
                                # Remove conflicting headers
                                proxy_hide_header Cache-Control;
                                proxy_hide_header Expires;
                            
                                # Set correct headers
                                add_header Content-Encoding gzip always;
                                add_header Cache-Control "public, no-transform, max-age=60" always;
                            }
          }

          location /peerjs {
              proxy_pass http://localhost:9000;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header Host $host;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

              # WebSocket support
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection "upgrade";
          }
      }
    EOT
    destination = "/etc/nginx/sites-available/${var.domain_name}"
  }

  provisioner "remote-exec" {
    inline = [
      "ln -sf /etc/nginx/sites-available/${var.domain_name} /etc/nginx/sites-enabled/",
      "rm -f /etc/nginx/sites-enabled/default",
      "systemctl restart nginx"
    ]
  }
}
# Install and configure PeerJS
resource "null_resource" "setup_peerjs" {
  depends_on = [null_resource.install_packages]

  connection {
     type        = "ssh"
     user        = var.ssh_user
     host        = var.host
     agent       = true
     private_key = file("~/.ssh/id_rsa")
   }

  # First, create the service file using file provisioner
  provisioner "file" {
    content     = <<-EOT
      [Unit]
      Description=PeerJS Server
      After=network.target

      [Service]
      ExecStart=peerjs --key fxbrawl --port 9000 --path /peerjs
      Restart=always
      User=nobody
      Group=nogroup
      Environment=PATH=/usr/bin:/usr/local/bin
      WorkingDirectory=/tmp

      [Install]
      WantedBy=multi-user.target
    EOT
    destination = "/etc/systemd/system/peerjs.service"
  }

  # Then run the commands to install and start the service
  provisioner "remote-exec" {
    inline = [
      "npm install -g peer",
      "systemctl daemon-reload",
      "systemctl enable peerjs",
      "systemctl start peerjs"
    ]
  }
}


# Configure GZIP compression
resource "null_resource" "configure_gzip" {
  depends_on = [null_resource.install_packages]

  connection {
    type        = "ssh"
    user        = var.ssh_user
    host        = var.host
    agent       = true
    private_key = file("~/.ssh/id_rsa")
  }

  provisioner "file" {
    content     = <<-EOT
      gzip on;
      gzip_disable "msie6";
      
      gzip_vary on;
      gzip_proxied any;
      gzip_comp_level 6;
      gzip_buffers 16 8k;
      gzip_http_version 1.1;
      gzip_min_length 256;
      gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;
    EOT
    destination = "/etc/nginx/conf.d/gzip.conf"
  }

  provisioner "remote-exec" {
    inline = [
      "systemctl reload nginx"
    ]
  }
}
# Install and configure Brotli compression
resource "null_resource" "setup_brotli" {
  depends_on = [null_resource.install_packages]

  connection {
    type        = "ssh"
    user        = var.ssh_user
    host        = var.host
    agent       = true
    private_key = file("~/.ssh/id_rsa")
  }

  provisioner "remote-exec" {
    inline = [
      # Install all dependencies for building Nginx modules
      "apt-get update",
      "apt-get install -y build-essential git libpcre3-dev zlib1g-dev libssl-dev libxml2-dev libxslt1-dev",
      
      # Create a working directory
      "rm -rf /tmp/nginx-brotli-build",
      "mkdir -p /tmp/nginx-brotli-build",
      "cd /tmp/nginx-brotli-build",
      
      # Get Nginx version
      "NGINX_VERSION=$(nginx -v 2>&1 | grep -o '[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+')",
      "echo \"Detected Nginx version: $NGINX_VERSION\"",
      
      # Download and extract Nginx source
      "wget http://nginx.org/download/nginx-$NGINX_VERSION.tar.gz",
      "tar -xzf nginx-$NGINX_VERSION.tar.gz",
      
      # Clone the Brotli module repository
      "git clone --recursive https://github.com/google/ngx_brotli.git",
      
      # Use a simpler approach for building the module
      "cd nginx-$NGINX_VERSION",
      
      # Configure with minimal options and add the brotli module
      "./configure --with-compat --add-dynamic-module=../ngx_brotli",
      
      # Build only the modules
      "make modules",
      
      # Create modules directory if it doesn't exist
      "mkdir -p /usr/share/nginx/modules",
      
      # Copy the compiled modules
      "cp objs/ngx_http_brotli_filter_module.so /usr/share/nginx/modules/ || { echo 'Failed to copy filter module'; exit 1; }",
      "cp objs/ngx_http_brotli_static_module.so /usr/share/nginx/modules/ || { echo 'Failed to copy static module'; exit 1; }",
      
      # Verify modules exist
      "ls -la /usr/share/nginx/modules/ngx_http_brotli_*.so",
      "echo 'Brotli modules successfully installed'",
      
      # Create modules-available directory if it doesn't exist
      "mkdir -p /etc/nginx/modules-available",
      
      # Create module configuration file
      "echo 'load_module \"/usr/share/nginx/modules/ngx_http_brotli_filter_module.so\";' > /etc/nginx/modules-available/brotli.conf",
      "echo 'load_module \"/usr/share/nginx/modules/ngx_http_brotli_static_module.so\";' >> /etc/nginx/modules-available/brotli.conf",
      
      # Create directory for modules-enabled if it doesn't exist
      "mkdir -p /etc/nginx/modules-enabled",
      
      # Enable the module
      "ln -sf /etc/nginx/modules-available/brotli.conf /etc/nginx/modules-enabled/",
      
      # Create Brotli configuration
      "echo 'brotli on;' > /etc/nginx/conf.d/brotli.conf",
      "echo 'brotli_comp_level 6;' >> /etc/nginx/conf.d/brotli.conf",
      "echo 'brotli_types application/atom+xml application/javascript application/json application/rss+xml application/vnd.ms-fontobject application/x-font-opentype application/x-font-truetype application/x-font-ttf application/x-javascript application/xhtml+xml application/xml font/eot font/opentype font/otf font/truetype image/svg+xml image/vnd.microsoft.icon image/x-icon image/x-win-bitmap text/css text/javascript text/plain text/xml;' >> /etc/nginx/conf.d/brotli.conf",
      
      # Clean up
      "rm -rf /tmp/nginx-brotli-build",
      
      # Test Nginx configuration
      "nginx -t",
      
      # Reload Nginx only if the test was successful
      "if [ $? -eq 0 ]; then systemctl reload nginx; else echo 'Nginx configuration test failed, not reloading'; exit 1; fi"
    ]
  }
}

# Configure Coturn server
resource "null_resource" "configure_coturn" {
  depends_on = [null_resource.install_packages]

   connection {
      type        = "ssh"
      user        = var.ssh_user
      host        = var.host
      agent       = true
      private_key = file("~/.ssh/id_rsa")
    }

  provisioner "file" {
    content     = <<-EOT
      # Coturn TURN SERVER configuration file

      # TURN listener port for UDP and TCP
      listening-port=3479

      # TURN listener port for TLS
      tls-listening-port=5349
      
      cert=/etc/letsencrypt/live/${var.domain_name}/fullchain.pem
      pkey=/etc/letsencrypt/live/${var.domain_name}/privkey.pem

      # Use fingerprint in TURN message
      fingerprint

      # Use long-term credential mechanism
      lt-cred-mech

      # Specify the server name
      server-name=${var.domain_name}

      # Specify the realm name
      realm=${var.domain_name}

      # Configure static user credentials (replace with your values)
      user=webrtcuser:webrtcpassword

      # Specify the relay addresses
      # Replace with your server's actual IP address if known
      # or use external-ip option below to auto-detect
      relay-ip=0.0.0.0
      listening-ip=134.122.53.93

      # Auto-detect external IP via STUN
      external-ip=134.122.53.93

      # Set the log file
      log-file=/var/log/turn/server.log

      # Enable verbose logging
      verbose

      # Use systemd for logging
      syslog

      # Don't let the server allow loopback IPs in peers' requests
      no-loopback-peers=1

      # Don't let the server to connect to peers on loopback IPs
      no-multicast-peers

      # Disable CLI support
      no-cli
    EOT
    destination = "/etc/turnserver.conf"
  }

  provisioner "remote-exec" {
    inline = [
      # Create log directory and set permissions
      "mkdir -p /var/log",
      "touch /var/log/turnserver.log",
      "chown turnserver:turnserver /var/log/turnserver.log",
      "chmod 644 /var/log/turnserver.log",
      "systemctl restart coturn"
    ]
  }
}

# Obtain Let's Encrypt SSL Certificate
resource "null_resource" "obtain_ssl_certificate" {
  depends_on = [null_resource.configure_nginx]

  connection {
     type        = "ssh"
     user        = var.ssh_user
     host        = var.host
     agent       = true
     private_key = file("~/.ssh/id_rsa")
   }

  provisioner "remote-exec" {
    inline = [
      "certbot --nginx --non-interactive --agree-tos -m ${var.email} -d ${var.domain_name}",
      "systemctl reload nginx"
    ]
  }
}

# Create a simple test page
resource "null_resource" "create_test_page" {
  depends_on = [null_resource.obtain_ssl_certificate]

  connection {
     type        = "ssh"
     user        = var.ssh_user
     host        = var.host
     agent       = true
     private_key = file("~/.ssh/id_rsa")
   }

  provisioner "file" {
    content     = <<-EOT
      <!DOCTYPE html>
      <html>
      <head>
          <title>WebRTC Test Page</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  margin: 0;
                  padding: 20px;
                  color: #333;
              }
              h1 {
                  color: #2c3e50;
              }
              .container {
                  max-width: 800px;
                  margin: 0 auto;
                  background-color: #f9f9f9;
                  padding: 20px;
                  border-radius: 5px;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Server Successfully Configured!</h1>
              <p>Your NGINX, PeerJS, and Coturn server has been successfully set up with HTTPS.</p>
              <p>Server Information:</p>
              <ul>
                  <li>Domain: ${var.domain_name}</li>
                  <li>NGINX: Active and serving this page</li>
                  <li>PeerJS: Running on port 9000 at path /peerjs</li>
                  <li>Coturn: Running on UDP port 3478 and TLS port 5349</li>
                  <li>HTTPS: Enabled with Let's Encrypt</li>
              </ul>
          </div>
      </body>
      </html>
    EOT
    destination = "/var/www/html/index.html"
  }
}


# Sync build folder to web server
resource "null_resource" "sync_build_folder" {
  depends_on = [null_resource.obtain_ssl_certificate]

  # Trigger the sync when any build files change
  triggers = {
    # Use a local-exec to generate a hash of all files in the build directory
    build_dir_hash = "${sha256(join("", [
      for f in fileset("${path.module}/../build", "**") :
      filesha256("${path.module}/../build/${f}")
    ]))}"
  }

  connection {
    type        = "ssh"
    user        = var.ssh_user
    host        = var.host
    agent       = true
    private_key = file("~/.ssh/id_rsa")
  }

  # First, ensure the destination directory exists and is empty
  provisioner "remote-exec" {
    inline = [
      "mkdir -p /var/www/html",
      "rm -rf /var/www/html/*"
    ]
  }

  # Then, copy the build folder to the server
  provisioner "local-exec" {
    command = "scp -r ${path.module}/../build/* ${var.ssh_user}@${var.host}:/var/www/html/"
  }

  # Set proper permissions
  provisioner "remote-exec" {
    inline = [
      "chown -R www-data:www-data /var/www/html",
      "chmod -R 755 /var/www/html",
      "echo 'Build files successfully synced to web server'"
    ]
  }
}

output "setup_complete" {
  value = "Setup completed successfully. Access your server at https://${var.domain_name}"
}
