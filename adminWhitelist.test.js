// Mock the database connection
jest.mock('./backend/utils/dbConfig', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn()
  }
}));

const db = require('./backend/utils/dbConfig');

describe('Admin Whitelist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should check if email is in whitelist', async () => {
    // Mock the database response
    db.query.mockResolvedValueOnce({ rows: [{ email: 'admin@example.com' }] });
    
    // Implementation of the function we're testing
    async function isInWhitelist(email) {
      const result = await db.query(
        'SELECT * FROM admin_whitelist WHERE email = $1',
        [email]
      );
      return result.rows.length > 0;
    }
    
    const result = await isInWhitelist('admin@example.com');
    
    expect(result).toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM admin_whitelist WHERE email = $1',
      ['admin@example.com']
    );
  });
});