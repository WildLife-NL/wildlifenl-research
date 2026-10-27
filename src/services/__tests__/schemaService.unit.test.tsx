import { getMinLength } from '../schemaService';

const jsonResponse = (status: number, body: any) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

describe('getMinLength - Unit Tests', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('RETURNS THE MIN LENGTH FROM THE SCHEMA', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { properties: { text: { type: 'string', minLength: 5 } } }));

    await expect(getMinLength('Answer', 'text')).resolves.toBe(5);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/schemas\/Answer\.json$/), expect.anything());
  });

  test('RETURNS UNDEFINED WHEN THE SCHEMA SETS NO MIN LENGTH FOR THE FIELD', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { properties: { identifier: { type: 'string' } } }));

    await expect(getMinLength('Questionnaire', 'identifier')).resolves.toBeUndefined();
  });

  test('THROWS WHEN THE SCHEMA ENDPOINT RETURNS AN ERROR', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { title: 'Internal Server Error' }));

    await expect(getMinLength('Answer', 'text')).rejects.toThrow('Could not load the validation rules for Answer text');
  });

  test('THROWS WHEN THE SCHEMA CANNOT BE FETCHED', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getMinLength('Answer', 'text')).rejects.toThrow('Could not load the validation rules for Answer text');
  });

  test('THROWS WHEN THE SCHEMA IS NOT JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    } as unknown as Response);

    await expect(getMinLength('Answer', 'text')).rejects.toThrow('Could not load the validation rules for Answer text');
  });

  test('THROWS WHEN THE SCHEMA DOES NOT DESCRIBE THE FIELD', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { properties: { label: { type: 'string', minLength: 5 } } }));

    await expect(getMinLength('Answer', 'text')).rejects.toThrow('Could not load the validation rules for Answer text');
  });

  test('THROWS WHEN THE MIN LENGTH IS NOT A NUMBER', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { properties: { text: { type: 'string', minLength: '5' } } }));

    await expect(getMinLength('Answer', 'text')).rejects.toThrow('Could not load the validation rules for Answer text');
  });
});
