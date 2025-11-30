export const mockValidator = ({
  isPayloadValid = true,
  payloadErrors = {},
  isUrlValid = true,
  urlErrors = {},
} = {}) => {
  return {
    async isValidAddPayload() {
      return {
        isValid: isPayloadValid,
        errors: isPayloadValid ? {} : payloadErrors,
      };
    },

    async isValidUrl() {
      return {
        isValid: isUrlValid,
        errors: isUrlValid ? {} : urlErrors,
      };
    },
  };
};
