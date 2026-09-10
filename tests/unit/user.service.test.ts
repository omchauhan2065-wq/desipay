/**
 * User Service Unit Tests
 * ================================================
 * Developed by: Om Chauhan
 */

import { userService } from '../../src/modules/user/user.service';
import { UserRole } from '../../src/config/security';
import { BadRequestError, NotFoundError } from '../../src/shared/errors';

describe('UserService', () => {
  const customerId = 'customer-test-id';
  const shopkeeperId = 'shopkeeper-test-id';
  const b2bId = 'b2b-test-id';

  beforeAll(() => {
    userService.seedMemoryUser({
      id: customerId,
      email: 'cust@desipay.com',
      phone: '+919999999001',
      fullName: 'Ramesh Kumar',
      role: UserRole.CUSTOMER,
      passwordHash: 'hash',
      mfaSecret: 'secret',
      isVerified: true,
      isActive: true,
      mfaEnabled: false,
    });

    userService.seedMemoryUser({
      id: shopkeeperId,
      email: 'shop@desipay.com',
      phone: '+919999999002',
      fullName: 'Sharma Kirana Store',
      role: UserRole.SHOPKEEPER,
      passwordHash: 'hash',
      isVerified: true,
      isActive: true,
      mfaEnabled: false,
    });

    userService.seedMemoryUser({
      id: b2bId,
      email: 'b2b@desipay.com',
      phone: '+919999999003',
      fullName: 'Gupta Wholesale Trading',
      role: UserRole.B2B_CUSTOMER,
      passwordHash: 'hash',
      isVerified: true,
      isActive: true,
      mfaEnabled: false,
    });
  });

  it('should retrieve safe user profile without passwordHash and mfaSecret', async () => {
    const profile = await userService.getProfile(customerId);
    expect(profile).toBeDefined();
    expect(profile.id).toBe(customerId);
    expect(profile.email).toBe('cust@desipay.com');
    expect((profile as any).passwordHash).toBeUndefined();
    expect((profile as any).mfaSecret).toBeUndefined();
  });

  it('should throw NotFoundError for non-existent user profile', async () => {
    await expect(userService.getProfile('non-existent-id')).rejects.toThrow(NotFoundError);
  });

  it('should update customer profile successfully', async () => {
    const updated = await userService.updateCustomerProfile(customerId, {
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      languagePref: 'hi',
    });

    expect(updated).toBeDefined();
    expect(updated.city).toBe('Delhi');
    expect(updated.languagePref).toBe('hi');
  });

  it('should reject customer profile update if user role is not customer', async () => {
    await expect(
      userService.updateCustomerProfile(shopkeeperId, { city: 'Mumbai' })
    ).rejects.toThrow(BadRequestError);
  });

  it('should update shopkeeper store profile successfully', async () => {
    const updated = await userService.updateShopkeeperProfile(shopkeeperId, {
      shopName: 'Sharma Super Mart',
      shopAddress: 'Shop 4, Main Market, Chandni Chowk',
      upiId: 'sharma@oksbi',
      deliveryEnabled: true,
      deliveryRadius: 5.5,
    });

    expect(updated).toBeDefined();
    expect(updated.shopName).toBe('Sharma Super Mart');
    expect(updated.deliveryEnabled).toBe(true);
  });

  it('should update B2B business profile successfully', async () => {
    const updated = await userService.updateB2bProfile(b2bId, {
      businessName: 'Gupta & Sons Agro Ltd',
      businessType: 'Wholesale Grain & Spices',
      annualRevenue: 5000000,
    });

    expect(updated).toBeDefined();
    expect(updated.businessName).toBe('Gupta & Sons Agro Ltd');
    expect(updated.annualRevenue).toBe(5000000);
  });

  it('should list users with pagination (Admin query)', async () => {
    const res = await userService.listUsers({ page: 1, limit: 10 });
    expect(res.users.length).toBeGreaterThanOrEqual(3);
    expect(res.pagination.total).toBeGreaterThanOrEqual(3);
  });
});
