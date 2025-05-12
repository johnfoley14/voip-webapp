# voip-webapp
VoIP web application using WebRTC. 

Currently this web app is deployed at 3.254.201.195. On visiting the webpage, a warning will appear saying this webpage may not be safe. This warning can be ignored, it is only appearing because the webpage is using a self-signed certificate that the browser does not trust.

The same issue will arise with the signaling server. Hence please visit 3.254.201.195:3000 and advance to the page to allow your browser safely use the signaling server. 

To access the core functionalities of the webpage, the server secret is required. Please use "isevoip" to bypass this authentication. Any username can be used. 

# nginx deployment
sudo nginx -t

# systemctl - monitoring deployment
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl stop nginx
sudo systemctl start nginx

sudo mv /home/ubuntu/voip-webapp/voip/dist/* /var/www/html/