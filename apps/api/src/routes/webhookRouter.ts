import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import prisma from '@repo/db/client';

export const webhookRouter = Router();

// Helper function to extract user data from different auth providers
function extractUserData(data: any) {
  console.log('🔍 Extracting user data from webhook payload...');
  console.log('📊 Raw data structure:', JSON.stringify(data, null, 2));
  
  // Handle different authentication providers (Google, Apple, GitHub, Email)
  let email = null;
  
  // Method 1: Try primary email address ID
  if (data.primary_email_address_id && data.email_addresses) {
    const emailAddress = data.email_addresses.find((email: any) => email.id === data.primary_email_address_id);
    email = emailAddress?.email_address;
    console.log('✅ Found email via primary_email_address_id:', email);
  }
  
  // Method 2: If no primary email, try first available email
  if (!email && data.email_addresses && data.email_addresses.length > 0) {
    email = data.email_addresses[0].email_address;
    console.log('✅ Found email via first email_addresses item:', email);
  }
  
  // Method 3: Check if email is directly on the user object (some OAuth providers)
  if (!email && data.email) {
    email = data.email;
    console.log('✅ Found email via direct data.email:', email);
  }

  if (!email) {
    console.error('❌ No email found for user:', data.id);
    console.error('❌ Available data:', {
      primary_email_address_id: data.primary_email_address_id,
      email_addresses: data.email_addresses,
      direct_email: data.email,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name
    });
    return null;
  }

  return {
    id: data.id,
    email: email,
    username: data.username || null,
    firstName: data.first_name || null,
    lastName: data.last_name || null,
    imageUrl: data.image_url || null,
  };
}

// LOCAL DEVELOPMENT: Commented out Clerk webhook for testing
// webhookRouter.post('/clerk', async (req: Request, res: Response) => {
//   const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

//   if (!WEBHOOK_SECRET) {
//     console.error('❌ CLERK_WEBHOOK_SECRET is not set');
//     return res.status(500).json({ error: 'Webhook secret not configured' });
//   }

//   // Get the headers
//   const svix_id = req.headers['svix-id'] as string;
//   const svix_timestamp = req.headers['svix-timestamp'] as string;
//   const svix_signature = req.headers['svix-signature'] as string;

//   // If there are no headers, error out
//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return res.status(400).json({ error: 'Missing svix headers' });
//     return;
//   }

//   // Get the body (raw buffer from express.raw middleware)
//   const payload = req.body.toString();

//   // Create a new Svix instance with your webhook secret
//   const wh = new Webhook(WEBHOOK_SECRET);

//   let evt: any;

//   // Verify the payload
//   try {
//     evt = wh.verify(payload, {
//       'svix-id': svix_id,
//       'svix-timestamp': svix_timestamp,
//       'svix-signature': svix_signature,
//     });
//   } catch (err) {
//     console.error('❌ Webhook verification failed:', err);
//     return res.status(400).json({ error: 'Webhook verification failed' });
//     return;
//   }

//   // Handle the webhook
//   const { type, data } = evt;
//   console.log(`🔔 Received webhook: ${type}`);

//   try {
//     switch (type) {
//       case 'user.created':
//         await handleUserCreated(data);
//         break;
//       case 'user.updated':
//         await handleUserUpdated(data);
//         break;
//       case 'user.deleted':
//         await handleUserDeleted(data);
//         break;
//       default:
//         console.log(`⚠️  Unhandled webhook type: ${type}`);
//     }

//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error(`❌ Error handling webhook ${type}:`, error);
//     res.status(500).json({ error: 'Internal server error' });
//     return;
//   }
// });

// LOCAL DEVELOPMENT: Dummy webhook endpoint that always succeeds
webhookRouter.post('/clerk', async (req: Request, res: Response) => {
  console.log('🔔 LOCAL DEV: Clerk webhook endpoint called (auth disabled)');
  res.status(200).json({ success: true, message: 'Local development mode - auth disabled' });
});

// Handler for user.created event
async function handleUserCreated(data: any) {
  console.log('👤 Creating user in database:', data.id);
  
  const userData = extractUserData(data);
  if (!userData) {
    return;
  }

  try {
    const user = await prisma.user.create({
      data: userData,
    });

    console.log('✅ User created successfully:', user.id);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  User already exists:', data.id);
    } else {
      console.error('❌ Failed to create user:', error);
      throw error;
    }
  }
}

// Handler for user.updated event
async function handleUserUpdated(data: any) {
  console.log('📝 Updating user in database:', data.id);
  
  const userData = extractUserData(data);
  if (!userData) {
    return;
  }

  try {
    const user = await prisma.user.upsert({
      where: { id: data.id },
      update: userData,
      create: userData,
    });

    console.log('✅ User updated successfully:', user.id);
  } catch (error) {
    console.error('❌ Failed to update user:', error);
    throw error;
  }
}

// Handler for user.deleted event
async function handleUserDeleted(data: any) {
  console.log('🗑️  Deleting user from database:', data.id);
  
  try {
    await prisma.user.delete({
      where: { id: data.id },
    });

    console.log('✅ User deleted successfully:', data.id);
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log('⚠️  User not found for deletion:', data.id);
    } else {
      console.error('❌ Failed to delete user:', error);
      throw error;
    }
  }
}