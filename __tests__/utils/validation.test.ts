import { 
  emailSchema, 
  passwordSchema, 
  phoneSchema, 
  signUpSchema, 
  signInSchema,
  validateField 
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123',
        'MyStr0ngP@ss',
        'Test123456'
      ];

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'short',           // Too short
        'nouppercase123',  // No uppercase
        'NOLOWERCASE123',  // No lowercase
        'NoNumbers',       // No numbers
        'password'         // Too weak
      ];

      invalidPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow();
      });
    });
  });

  describe('phoneSchema', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+44 20 7946 0958',
        '+1 (555) 123-4567',
        '555-123-4567'
      ];

      validPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).not.toThrow();
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',
        '++1234567890',
        '123'
      ];

      invalidPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).toThrow();
      });
    });

    it('should allow undefined phone numbers', () => {
      expect(() => phoneSchema.parse(undefined)).not.toThrow();
    });
  });

  describe('signUpSchema', () => {
    it('should validate complete sign up form', () => {
      const validForm = {
        email: 'test@example.com',
        password: 'Password123',
        displayName: 'Test User',
        phoneNumber: '+1234567890'
      };

      expect(() => signUpSchema.parse(validForm)).not.toThrow();
    });

    it('should reject invalid sign up form', () => {
      const invalidForm = {
        email: 'invalid-email',
        password: 'weak',
        displayName: '',
        phoneNumber: 'invalid'
      };

      expect(() => signUpSchema.parse(invalidForm)).toThrow();
    });
  });

  describe('signInSchema', () => {
    it('should validate sign in form', () => {
      const validForm = {
        email: 'test@example.com',
        password: 'anypassword'
      };

      expect(() => signInSchema.parse(validForm)).not.toThrow();
    });

    it('should require email and password', () => {
      const invalidForms = [
        { email: '', password: 'password' },
        { email: 'test@example.com', password: '' },
        { email: 'invalid-email', password: 'password' }
      ];

      invalidForms.forEach(form => {
        expect(() => signInSchema.parse(form)).toThrow();
      });
    });
  });

  describe('validateField', () => {
    it('should return valid result for correct input', () => {
      const result = validateField(emailSchema, 'test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid result with error message', () => {
      const result = validateField(emailSchema, 'invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('should handle unexpected errors gracefully', () => {
      const mockSchema = {
        parse: jest.fn(() => {
          throw new Error('Unexpected error');
        })
      } as any;

      const result = validateField(mockSchema, 'test');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });
});