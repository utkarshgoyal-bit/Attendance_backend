import mongoose from "mongoose";

const {
  Schema: { Types },
  model,
  Schema,
} = mongoose;

const holidaySchema = new Schema(
  {
    // Holiday date - the date of the holiday
    date: {
      type: Types.Date,
      required: [true, 'Date is required'],
      unique: true,
    },

    // Holiday name - name/description of the holiday
    name: {
      type: Types.String,
      required: [true, 'Holiday name is required'],
    },

    // Type of holiday
    // NATIONAL: National holidays (e.g., Independence Day)
    // FESTIVAL: Festival holidays (e.g., Diwali, Eid)
    // OPTIONAL: Optional holidays that employees can choose to take
    type: {
      type: Types.String,
      enum: ['NATIONAL', 'FESTIVAL', 'OPTIONAL'],
      default: 'NATIONAL',
    },

    // Whether this holiday is currently active
    // Can be set to false to disable a holiday without deleting it
    isActive: {
      type: Types.Boolean,
      default: true,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Performance optimization indexes
// Index on date for querying holidays by date
holidaySchema.index({ date: 1 });

// Index on isActive for filtering active/inactive holidays
holidaySchema.index({ isActive: 1 });

const Holiday = mongoose.model("Holiday", holidaySchema, "holiday");

export default Holiday;
