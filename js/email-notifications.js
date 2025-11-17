// Email Notification System for UTA Lost & Found
// This file contains the logic for sending email notifications

import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './firebase-config.js';

class EmailNotificationService {
    constructor() {
        this.notifications = [];
    }

    // Send contact notification to item owner
    async sendContactNotification(contactRequest) {
        try {
            console.log('📧 Sending contact notification:', contactRequest);
            
            // Create email content
            const emailContent = this.generateContactEmail(contactRequest);
            
            // Store notification for admin to send
            const notification = {
                type: 'CONTACT_REQUEST',
                recipientEmail: contactRequest.itemOwnerEmail,
                senderEmail: contactRequest.requesterEmail,
                senderName: contactRequest.requesterName,
                itemTitle: contactRequest.itemTitle,
                message: contactRequest.message,
                emailContent: emailContent,
                status: 'PENDING',
                createdAt: serverTimestamp(),
                contactRequestId: contactRequest.id,
                priority: 'HIGH'
            };

            await addDoc(collection(db, 'notifications'), notification);
            
            // Also try to send via mailto link as fallback
            this.sendMailtoFallback(contactRequest, emailContent);
            
            console.log('✅ Contact notification queued for sending');
            return true;
        } catch (error) {
            console.error('❌ Error sending contact notification:', error);
            return false;
        }
    }

    // Send claim notification to item owner
    async sendClaimNotification(item, claimerEmail, claimerName) {
        try {
            console.log('📧 Sending claim notification:', { item: item.title, claimerEmail });
            
            // Create email content
            const emailContent = this.generateClaimEmail(item, claimerEmail, claimerName);
            
            const notification = {
                type: 'CLAIM_REQUEST',
                recipientEmail: item.utaEmail,
                senderEmail: claimerEmail,
                senderName: claimerName,
                itemTitle: item.title,
                message: `Someone has claimed your ${item.mode.toLowerCase()} item "${item.title}". Please verify their claim details.`,
                emailContent: emailContent,
                status: 'PENDING',
                createdAt: serverTimestamp(),
                itemId: item.id,
                priority: 'HIGH'
            };

            await addDoc(collection(db, 'notifications'), notification);
            
            // Also try to send via mailto link as fallback
            this.sendClaimMailtoFallback(item, claimerEmail, claimerName, emailContent);
            
            console.log('✅ Claim notification queued for sending');
            return true;
        } catch (error) {
            console.error('❌ Error sending claim notification:', error);
            return false;
        }
    }

    // Get pending notifications (for admin dashboard)
    async getPendingNotifications() {
        try {
            const notificationsCollection = collection(db, 'notifications');
            const q = query(
                notificationsCollection,
                where('status', '==', 'PENDING'),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            
            const notifications = [];
            querySnapshot.forEach((doc) => {
                notifications.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
                });
            });
            
            return notifications;
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    // Mark notification as sent
    async markNotificationSent(notificationId) {
        try {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            await updateDoc(doc(db, 'notifications', notificationId), {
                status: 'SENT',
                sentAt: serverTimestamp()
            });
            
            console.log('✅ Notification marked as sent');
            return true;
        } catch (error) {
            console.error('Error marking notification as sent:', error);
            return false;
        }
    }

    // Generate email content for contact requests
    generateContactEmail(contactRequest) {
        const subject = `UTA Lost & Found: Someone is interested in your ${contactRequest.itemMode.toLowerCase()} item`;
        const body = `Dear UTA Student,

Good news! Someone has expressed interest in your ${contactRequest.itemMode.toLowerCase()} item on the UTA Lost & Found system.

📋 ITEM DETAILS:
• Item: "${contactRequest.itemTitle}"
• Type: ${contactRequest.itemMode === 'LOST' ? 'Lost Item' : 'Found Item'}
• Posted: ${new Date().toLocaleDateString()}

👤 CONTACT INFORMATION:
• Name: ${contactRequest.requesterName}
• Email: ${contactRequest.requesterEmail}
• UTA Email: ${contactRequest.requesterEmail.includes('@mavs.uta.edu') ? 'Yes' : 'No'}

💬 MESSAGE FROM THE PERSON:
"${contactRequest.message}"

📞 NEXT STEPS:
1. Contact the person directly using the email above
2. Arrange a meeting to verify ownership
3. Meet in a safe, public location on campus
4. Verify the item matches your description before handing it over

⚠️ SAFETY REMINDERS:
• Always meet in public places (Library, Student Union, etc.)
• Verify the person's UTA ID if possible
• Trust your instincts - if something feels wrong, don't proceed
• Consider bringing a friend to the meeting

🏫 UTA LOST & FOUND SUPPORT:
If you need assistance or have concerns, please contact us:
• Email: lostfound@uta.edu
• Phone: (817) 272-2011
• Office: Student Union, Room 101

Thank you for using the UTA Lost & Found system!

Best regards,
UTA Lost & Found Team
University of Texas at Arlington

---
This is an automated message from the UTA Lost & Found system.
Please do not reply to this email. Contact the person directly using the information provided above.`;

        return { subject, body };
    }

    // Generate email content for claim requests
    generateClaimEmail(item, claimerEmail, claimerName) {
        const subject = `UTA Lost & Found: Someone has claimed your ${item.mode.toLowerCase()} item`;
        const body = `Dear UTA Student,

Great news! Someone has claimed your ${item.mode.toLowerCase()} item on the UTA Lost & Found system.

📋 ITEM DETAILS:
• Item: "${item.title}"
• Type: ${item.mode === 'LOST' ? 'Lost Item' : 'Found Item'}
• Description: ${item.description}
• Location: ${item.location}
• Category: ${item.category}

👤 CLAIMER INFORMATION:
• Name: ${claimerName}
• Email: ${claimerEmail}
• UTA Email: ${claimerEmail.includes('@mavs.uta.edu') ? 'Yes' : 'No'}

📞 NEXT STEPS:
1. Contact the claimer directly using the email above
2. Ask them to provide proof of ownership (describe unique features, serial numbers, etc.)
3. Arrange a meeting in a safe, public location on campus
4. Verify their claim details before handing over the item

⚠️ VERIFICATION CHECKLIST:
• Ask them to describe unique features of the item
• Request any serial numbers or identifying marks
• Verify they can provide additional details not listed publicly
• Trust your instincts - if something feels wrong, don't proceed

🏫 UTA LOST & FOUND SUPPORT:
If you need assistance or have concerns, please contact us:
• Email: lostfound@uta.edu
• Phone: (817) 272-2011
• Office: Student Union, Room 101

Thank you for using the UTA Lost & Found system!

Best regards,
UTA Lost & Found Team
University of Texas at Arlington

---
This is an automated message from the UTA Lost & Found system.
Please do not reply to this email. Contact the claimer directly using the information provided above.`;

        return { subject, body };
    }

    // Send mailto fallback (opens user's email client)
    sendMailtoFallback(contactRequest, emailContent) {
        try {
            const mailtoLink = `mailto:${contactRequest.itemOwnerEmail}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`;
            
            // Show user a message about opening email client
            const shouldOpen = confirm(`📧 Email notification ready!\n\nWe'll open your email client to send a notification to ${contactRequest.itemOwnerEmail}.\n\nClick OK to open your email client, or Cancel to skip.`);
            
            if (shouldOpen) {
                window.open(mailtoLink, '_blank');
            }
        } catch (error) {
            console.error('Error with mailto fallback:', error);
        }
    }

    // Send claim mailto fallback
    sendClaimMailtoFallback(item, claimerEmail, claimerName, emailContent) {
        try {
            const mailtoLink = `mailto:${item.utaEmail}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`;
            
            const shouldOpen = confirm(`📧 Claim notification ready!\n\nWe'll open your email client to notify ${item.utaEmail} about the claim.\n\nClick OK to open your email client, or Cancel to skip.`);
            
            if (shouldOpen) {
                window.open(mailtoLink, '_blank');
            }
        } catch (error) {
            console.error('Error with claim mailto fallback:', error);
        }
    }

    // Send notification when a similar item is found
    async sendSimilarItemNotification(newItem, similarItem, matchScore, matchReasons) {
        try {
            console.log(`📧 Sending similar item notification to ${similarItem.utaEmail}`);
            
            // Create email content
            const emailContent = this.generateSimilarItemEmail(newItem, similarItem, matchScore, matchReasons);
            
            // Store notification for admin to send via EmailJS
            const notification = {
                type: 'SIMILAR_ITEM_FOUND',
                recipientEmail: similarItem.utaEmail,
                recipientName: similarItem.userName || 'UTA User',
                newItemTitle: newItem.title,
                newItemId: newItem.id || 'pending',
                similarItemTitle: similarItem.title,
                similarItemId: similarItem.id,
                matchScore: matchScore,
                matchReasons: matchReasons,
                emailContent: emailContent,
                status: 'PENDING',
                createdAt: serverTimestamp(),
                priority: 'HIGH'
            };

            const notificationRef = await addDoc(collection(db, 'notifications'), notification);
            notification.id = notificationRef.id; // Add the document ID
            
            // Try to send via EmailJS if configured
            await this.sendViaEmailJS(notification);
            
            console.log('✅ Similar item notification queued');
            return true;
        } catch (error) {
            console.error('❌ Error sending similar item notification:', error);
            return false;
        }
    }

    // Generate email content for similar item notifications
    generateSimilarItemEmail(newItem, similarItem, matchScore, matchReasons) {
        const matchPercentage = Math.round(matchScore * 100);
        const subject = `UTA Lost & Found: Potential Match Found for Your ${similarItem.mode} Item!`;
        const body = `Dear ${similarItem.userName || 'UTA Student'},

Great news! We found a ${newItem.mode.toLowerCase()} item that might match your ${similarItem.mode.toLowerCase()} item.

📋 YOUR ITEM:
• Title: "${similarItem.title}"
• Category: ${similarItem.category}
• Location: ${similarItem.location}
• Date: ${new Date(similarItem.date || similarItem.submittedAt).toLocaleDateString()}

🎯 POTENTIAL MATCH FOUND:
• Title: "${newItem.title}"
• Category: ${newItem.category}
• Location: ${newItem.location}
• Match Score: ${matchPercentage}% similarity

✅ MATCH REASONS:
${matchReasons.map(reason => `• ${reason}`).join('\n')}

📞 NEXT STEPS:
1. Log in to the UTA Lost & Found system
2. View the potential match item details
3. Compare the item with what you lost/found
4. If it matches, contact the other user through the platform
5. Arrange a safe meeting to verify ownership

🔗 VIEW ITEM:
Visit: https://utalostandfound.netlify.app
Then browse items or search for: "${newItem.title}"

⚠️ IMPORTANT REMINDERS:
• Always verify ownership before claiming
• Meet in a safe, public location on campus
• Ask for proof of ownership (serial numbers, unique features, etc.)
• Trust your instincts - if something doesn't match, don't proceed

🏫 UTA LOST & FOUND SUPPORT:
If you need assistance, contact us:
• Email: lostfound@uta.edu
• Phone: (817) 272-2011

Thank you for using the UTA Lost & Found system!

Best regards,
UTA Lost & Found Team
University of Texas at Arlington

---
This is an automated notification from the UTA Lost & Found system.
The matching algorithm found ${matchPercentage}% similarity between items.`;

        return { subject, body };
    }

    // Send email via EmailJS (if configured)
    async sendViaEmailJS(notification) {
        try {
            // Check if EmailJS is loaded and configured
            if (typeof emailjs === 'undefined') {
                console.log('📧 EmailJS not loaded - skipping direct email send');
                return false;
            }

            const emailjsConfig = window.EMAILJS_CONFIG || {};
            if (!emailjsConfig.serviceId || !emailjsConfig.templateId || !emailjsConfig.userId) {
                console.log('📧 EmailJS not configured - notification queued for admin');
                return false;
            }

            // Send via EmailJS
            const templateParams = {
                to_email: notification.recipientEmail,
                to_name: notification.recipientName,
                subject: notification.emailContent.subject,
                message: notification.emailContent.body,
                item_title: notification.newItemTitle,
                match_score: Math.round(notification.matchScore * 100)
            };

            await emailjs.send(
                emailjsConfig.serviceId,
                emailjsConfig.templateId,
                templateParams,
                emailjsConfig.userId
            );

            console.log('✅ Email sent via EmailJS');
            
            // Mark notification as sent
            await this.markNotificationSent(notification.id);
            return true;
        } catch (error) {
            console.warn('⚠️ EmailJS send failed (notification still queued):', error);
            return false;
        }
    }
}

// Create global instance
window.emailNotificationService = new EmailNotificationService();

// Export for use in other files
export { EmailNotificationService };