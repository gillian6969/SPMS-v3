const UserSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Add preferences field
  preferences: {
    type: Object,
    default: {}
  }
  
  // ... existing fields ...
}); 