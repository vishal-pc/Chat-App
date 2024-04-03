// password validation
export const passwordRegex =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

// email validation
export const emailValidate = (email: string) => {
  if (
    String(email).match(
      /^[A-Za-z0-9._%-]+@(?:[A-Za-z0-9]+\.)+(com|co\.in|yahoo\.com)$/
    )
  ) {
    return true;
  } else {
    return false;
  }
};

// otp generate
export const generateOTP = (): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};
