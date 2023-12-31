import { model, Schema } from "mongoose";
import { GENDERS } from "../constants.js";
import * as validations from "../validators/helpers.js";
import JwtService from "../services/jwt-service.js";
import PasswordService from "../services/password-service.js";

const PreferenceSchema = new Schema({
  smoking: {
    type: Boolean,
  },
  drinking: {
    type: Boolean,
  },
  pets: {
    type: Boolean,
  },
  rent: {
    type: Object,
    validate: {
      validator: function (v) {
        if (Object.keys(v).length === 0) return true;
        const hasMin = typeof v.min === "number";
        const hasMax = typeof v.max === "number";

        if ((hasMin && !hasMax) || (!hasMin && hasMax)) {
          return false;
        }

        if (!hasMin && !hasMax) {
          return true;
        }

        try {
          validations.validateNumberRange(v.min, "min rent", {
            min: 0,
          });
        } catch (error) {
          return false;
        }
        try {
          validations.validateNumberRange(v.max, "max rent", {
            min: v.min,
          });
        } catch (error) {
          return false;
        }

        return v.min < v.max;
      },
      message: () => `Rent range is not valid!`,
    },
  },
  age: {
    type: Object,
    validate: {
      validator: function (v) {
        if (Object.keys(v).length === 0) return true;
        const hasMin = typeof v.min === "number";
        const hasMax = typeof v.max === "number";

        if (hasMin) {
          try {
            validations.validateNumberRange(v.min, "min age", {
              min: 18,
              includeMin: true,
            });
          } catch (error) {
            return false;
          }
        }
        if (hasMax) {
          try {
            validations.validateNumberRange(v.max, "max age", {
              min: 18,
              max: 100,
              includeMin: true,
            });
          } catch (error) {
            return false;
          }
        }

        return hasMin && hasMax ? v.min <= v.max : true;
      },
      message: () => `Age range is not valid!`,
    },
  },
  genders: {
    type: Array,
    validate: {
      validator: function (v) {
        return !v || v.every((g) => Object.values(GENDERS).includes(g));
      },
      message: (props) => `${props.value} does not have valid genders!`,
    },
  },
});

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required!"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required!"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: [true, "Email already exists!"],
      trim: true,
      validate: {
        validator: function (v) {
          return validations.isValidEmail(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    phone: {
      type: String,
      required: [true, "Phone number is required!"],
      unique: [true, "Phone number already exists!"],
      trim: true,
    },
    encryptedPassword: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required!"],
      validate: {
        validator: function (v) {
          try {
            validations.validateDOB(v);
            return true;
          } catch {
            return false;
          }
        },
        message: (props) => `${props.value} is not a valid date of birth!`,
      },
    },
    gender: {
      type: String,
      validate: {
        validator: function (v) {
          return Object.values(GENDERS).includes(v);
        },
        message: (props) => `${props.value} is not a valid gender!`,
      },
      required: [true, "Gender is required!"],
    },
    location: {
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
    },
    bio: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    preferences: {
      type: PreferenceSchema,
    },
  },
  {
    timestamps: true,
    methods: {
      async verifyPassword(password) {
        try {
          return new PasswordService(password).verify(this.encryptedPassword);
        } catch (error) {
          return false;
        }
      },
      fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
      generateToken() {
        return JwtService.encrypt({
          _id: this._id,
          email: this.email,
        });
      },
    },
  }
);

UserSchema.index({
  firstName: "text",
  lastName: "text",
  email: "text",
});

const User = model("User", UserSchema);

export default User;
