# Flutter App - Package Settings & Options Configuration Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Complete guide for implementing package settings and options configuration in Flutter mobile applications

---

## Table of Contents

1. [Overview](#overview)
2. [Package Options Structure](#package-options-structure)
3. [Expiration Settings](#expiration-settings)
4. [Reminder Settings](#reminder-settings)
5. [Permission Settings](#permission-settings)
6. [Complete Implementation](#complete-implementation)
7. [UI Examples](#ui-examples)
8. [Validation Rules](#validation-rules)
9. [API Integration](#api-integration)
10. [Best Practices](#best-practices)

---

## Overview

When creating a package, you can configure various settings that control:
- **Expiration**: When the package expires and reminder notifications
- **Automatic Reminders**: Scheduled reminders for pending participants
- **Permissions**: What participants can and cannot do (download, reassign, add receivers)

These settings are configured in **Step 3: Review & Configuration** during package creation and can be edited when updating a draft package.

### Key Concepts

- **Package Options**: Configuration object that controls package behavior
- **Default Values**: Most settings have sensible defaults
- **Validation**: Some settings depend on others (e.g., reminder period requires expiration)
- **Status Impact**: Some settings only apply to "Sent" packages

---

## Package Options Structure

### Complete Options Schema

```dart
class PackageOptions {
  // Expiration Settings
  final DateTime? expiresAt;                    // When package expires
  final bool sendExpirationReminders;          // Send reminder before expiry
  final String? reminderPeriod;                // When to send expiry reminder
  
  // Automatic Reminder Settings
  final bool sendAutomaticReminders;           // Send automatic reminders
  final int? firstReminderDays;                // Days until first reminder
  final int? repeatReminderDays;               // Days between repeat reminders
  
  // Permission Settings
  final bool allowDownloadUnsigned;            // Allow downloading unsigned document
  final bool allowReassign;                    // Allow participants to reassign
  final bool allowReceiversToAdd;              // Allow receivers to add more recipients
  
  PackageOptions({
    this.expiresAt,
    this.sendExpirationReminders = false,
    this.reminderPeriod,
    this.sendAutomaticReminders = false,
    this.firstReminderDays,
    this.repeatReminderDays,
    this.allowDownloadUnsigned = true,
    this.allowReassign = true,
    this.allowReceiversToAdd = true,
  });
  
  // Default options
  static PackageOptions defaults() {
    return PackageOptions();
  }
  
  // Copy with method for immutability
  PackageOptions copyWith({
    DateTime? expiresAt,
    bool? sendExpirationReminders,
    String? reminderPeriod,
    bool? sendAutomaticReminders,
    int? firstReminderDays,
    int? repeatReminderDays,
    bool? allowDownloadUnsigned,
    bool? allowReassign,
    bool? allowReceiversToAdd,
  }) {
    return PackageOptions(
      expiresAt: expiresAt ?? this.expiresAt,
      sendExpirationReminders: sendExpirationReminders ?? this.sendExpirationReminders,
      reminderPeriod: reminderPeriod ?? this.reminderPeriod,
      sendAutomaticReminders: sendAutomaticReminders ?? this.sendAutomaticReminders,
      firstReminderDays: firstReminderDays ?? this.firstReminderDays,
      repeatReminderDays: repeatReminderDays ?? this.repeatReminderDays,
      allowDownloadUnsigned: allowDownloadUnsigned ?? this.allowDownloadUnsigned,
      allowReassign: allowReassign ?? this.allowReassign,
      allowReceiversToAdd: allowReceiversToAdd ?? this.allowReceiversToAdd,
    );
  }
  
  // JSON serialization
  Map<String, dynamic> toJson() {
    return {
      if (expiresAt != null) 'expiresAt': expiresAt!.toIso8601String(),
      'sendExpirationReminders': sendExpirationReminders,
      if (reminderPeriod != null) 'reminderPeriod': reminderPeriod,
      'sendAutomaticReminders': sendAutomaticReminders,
      if (firstReminderDays != null) 'firstReminderDays': firstReminderDays,
      if (repeatReminderDays != null) 'repeatReminderDays': repeatReminderDays,
      'allowDownloadUnsigned': allowDownloadUnsigned,
      'allowReassign': allowReassign,
      'allowReceiversToAdd': allowReceiversToAdd,
    };
  }
  
  factory PackageOptions.fromJson(Map<String, dynamic> json) {
    return PackageOptions(
      expiresAt: json['expiresAt'] != null 
          ? DateTime.parse(json['expiresAt']) 
          : null,
      sendExpirationReminders: json['sendExpirationReminders'] ?? false,
      reminderPeriod: json['reminderPeriod'],
      sendAutomaticReminders: json['sendAutomaticReminders'] ?? false,
      firstReminderDays: json['firstReminderDays'],
      repeatReminderDays: json['repeatReminderDays'],
      allowDownloadUnsigned: json['allowDownloadUnsigned'] ?? true,
      allowReassign: json['allowReassign'] ?? true,
      allowReceiversToAdd: json['allowReceiversToAdd'] ?? true,
    );
  }
}
```

---

## Expiration Settings

### Overview

Expiration settings control when a package expires and whether reminders are sent before expiration.

### Settings

#### 1. `expiresAt` (DateTime?)

**Description**: The date and time when the package will expire.

**Default**: `null` (package never expires)

**Usage**: 
- Set to future date/time to enable expiration
- Set to `null` to disable expiration
- Packages cannot be accessed after expiration
- Must be in the future when setting

**Example:**
```dart
// Set expiration to 7 days from now
final expirationDate = DateTime.now().add(Duration(days: 7));
options = options.copyWith(expiresAt: expirationDate);

// Remove expiration
options = options.copyWith(expiresAt: null);
```

#### 2. `sendExpirationReminders` (bool)

**Description**: Whether to send reminder notifications before package expiration.

**Default**: `false`

**Requires**: `expiresAt` must be set

**Usage**:
- Only works if `expiresAt` is set
- System sends reminder based on `reminderPeriod` setting
- Participants receive email reminders

**Example:**
```dart
options = options.copyWith(
  expiresAt: DateTime.now().add(Duration(days: 7)),
  sendExpirationReminders: true,
  reminderPeriod: '1_day_before',
);
```

#### 3. `reminderPeriod` (String?)

**Description**: When to send expiration reminder relative to expiration date.

**Default**: `null`

**Valid Values**:
- `"1_day_before"` - Send reminder 1 day before expiration
- `"2_days_before"` - Send reminder 2 days before expiration
- `"1_hour_before"` - Send reminder 1 hour before expiration
- `"2_hours_before"` - Send reminder 2 hours before expiration
- `null` - Don't send reminders (requires `sendExpirationReminders = false`)

**Requires**: `sendExpirationReminders = true` and `expiresAt` must be set

**Example:**
```dart
// Reminder enum for type safety
enum ExpirationReminderPeriod {
  oneDayBefore('1_day_before'),
  twoDaysBefore('2_days_before'),
  oneHourBefore('1_hour_before'),
  twoHoursBefore('2_hours_before');
  
  final String value;
  const ExpirationReminderPeriod(this.value);
}

// Usage
options = options.copyWith(
  expiresAt: DateTime.now().add(Duration(days: 7)),
  sendExpirationReminders: true,
  reminderPeriod: ExpirationReminderPeriod.oneDayBefore.value,
);
```

---

## Reminder Settings

### Overview

Automatic reminder settings control scheduled reminders sent to participants who haven't completed their required actions.

### Settings

#### 1. `sendAutomaticReminders` (bool)

**Description**: Whether to send automatic reminders to pending participants.

**Default**: `false`

**Usage**:
- When enabled, system automatically sends reminders based on schedule
- Reminders only sent to participants with incomplete required fields
- Works independently of expiration reminders

**Example:**
```dart
options = options.copyWith(
  sendAutomaticReminders: true,
  firstReminderDays: 3,
  repeatReminderDays: 2,
);
```

#### 2. `firstReminderDays` (int?)

**Description**: Number of days after package is sent before first automatic reminder.

**Default**: `null`

**Requires**: `sendAutomaticReminders = true`

**Validation**:
- Must be a positive number
- Must be provided if `sendAutomaticReminders = true`

**Example:**
```dart
// Send first reminder after 3 days
options = options.copyWith(
  sendAutomaticReminders: true,
  firstReminderDays: 3,
);
```

#### 3. `repeatReminderDays` (int?)

**Description**: Number of days between repeat automatic reminders.

**Default**: `null`

**Requires**: `sendAutomaticReminders = true`

**Validation**:
- Must be a positive number
- Must be provided if `sendAutomaticReminders = true`
- System continues sending reminders until participant completes or package expires

**Example:**
```dart
// Send reminder every 2 days after first reminder
options = options.copyWith(
  sendAutomaticReminders: true,
  firstReminderDays: 3,
  repeatReminderDays: 2,
);
```

**Reminder Schedule Example:**
```
Package sent: Day 0
First reminder: Day 3 (firstReminderDays = 3)
Second reminder: Day 5 (firstReminderDays + repeatReminderDays = 3 + 2)
Third reminder: Day 7 (previous + repeatReminderDays = 5 + 2)
...continues until completion or expiration
```

---

## Permission Settings

### Overview

Permission settings control what participants can and cannot do with the package.

### Settings

#### 1. `allowDownloadUnsigned` (bool)

**Description**: Whether participants can download the document before it's fully signed.

**Default**: `true`

**Usage**:
- `true`: Participants can download document at any time
- `false`: Participants can only download after all signatures are collected
- Applies to all participants (signers, receivers, etc.)

**Use Cases**:
- **Allow Download**: Useful when participants need to review document
- **Disallow Download**: Useful for sensitive documents or to maintain control

**Example:**
```dart
// Prevent downloading until fully signed
options = options.copyWith(allowDownloadUnsigned: false);

// Allow downloading (default)
options = options.copyWith(allowDownloadUnsigned: true);
```

#### 2. `allowReassign` (bool)

**Description**: Whether participants can reassign their fields to another contact.

**Default**: `true`

**Usage**:
- `true`: Participants can transfer their assignments to another contact
- `false`: Participants cannot reassign (even if they haven't signed yet)
- Only applies if participant hasn't signed any fields yet

**Use Cases**:
- **Allow Reassign**: Useful when flexibility is needed (e.g., team changes)
- **Disallow Reassign**: Useful when specific individuals must sign (e.g., legal requirements)

**Example:**
```dart
// Prevent reassignment
options = options.copyWith(allowReassign: false);

// Allow reassignment (default)
options = options.copyWith(allowReassign: true);
```

**Important Notes**:
- Reassignment is blocked if participant has already signed any field
- New participant receives invitation email
- Original participant loses access
- Reassignment is recorded in audit trail

#### 3. `allowReceiversToAdd` (bool)

**Description**: Whether receivers can add more recipients to the package.

**Default**: `true`

**Usage**:
- `true`: Receivers can add additional receivers to the package
- `false`: Only package owner can add receivers
- Applies to all receivers

**Use Cases**:
- **Allow Adding**: Useful when receivers know who else needs the document
- **Disallow Adding**: Useful when owner wants to maintain control over recipients

**Example:**
```dart
// Prevent receivers from adding others
options = options.copyWith(allowReceiversToAdd: false);

// Allow receivers to add others (default)
options = options.copyWith(allowReceiversToAdd: true);
```

---

## Complete Implementation

### Package Options Manager

```dart
class PackageOptionsManager {
  PackageOptions _options;
  
  PackageOptionsManager({PackageOptions? initialOptions})
      : _options = initialOptions ?? PackageOptions.defaults();
  
  PackageOptions get options => _options;
  
  // Expiration Methods
  void setExpiration(DateTime? date) {
    _options = _options.copyWith(expiresAt: date);
    // Clear expiration reminders if no expiration
    if (date == null) {
      _options = _options.copyWith(
        sendExpirationReminders: false,
        reminderPeriod: null,
      );
    }
  }
  
  void setExpirationReminders({
    required bool enabled,
    String? reminderPeriod,
  }) {
    if (enabled && _options.expiresAt == null) {
      throw Exception('Cannot enable expiration reminders without expiration date');
    }
    
    _options = _options.copyWith(
      sendExpirationReminders: enabled,
      reminderPeriod: enabled ? reminderPeriod : null,
    );
  }
  
  // Automatic Reminder Methods
  void setAutomaticReminders({
    required bool enabled,
    int? firstReminderDays,
    int? repeatReminderDays,
  }) {
    if (enabled && (firstReminderDays == null || repeatReminderDays == null)) {
      throw Exception('First reminder days and repeat days are required when automatic reminders are enabled');
    }
    
    _options = _options.copyWith(
      sendAutomaticReminders: enabled,
      firstReminderDays: enabled ? firstReminderDays : null,
      repeatReminderDays: enabled ? repeatReminderDays : null,
    );
  }
  
  // Permission Methods
  void setAllowDownloadUnsigned(bool allow) {
    _options = _options.copyWith(allowDownloadUnsigned: allow);
  }
  
  void setAllowReassign(bool allow) {
    _options = _options.copyWith(allowReassign: allow);
  }
  
  void setAllowReceiversToAdd(bool allow) {
    _options = _options.copyWith(allowReceiversToAdd: allow);
  }
  
  // Validation
  List<String> validate() {
    final errors = <String>[];
    
    // Expiration reminders require expiration date
    if (_options.sendExpirationReminders && _options.expiresAt == null) {
      errors.add('Expiration reminders require an expiration date');
    }
    
    // Reminder period requires expiration reminders
    if (_options.reminderPeriod != null && !_options.sendExpirationReminders) {
      errors.add('Reminder period requires expiration reminders to be enabled');
    }
    
    // Automatic reminders require schedule
    if (_options.sendAutomaticReminders) {
      if (_options.firstReminderDays == null) {
        errors.add('First reminder days is required when automatic reminders are enabled');
      }
      if (_options.repeatReminderDays == null) {
        errors.add('Repeat reminder days is required when automatic reminders are enabled');
      }
      if (_options.firstReminderDays != null && _options.firstReminderDays! < 1) {
        errors.add('First reminder days must be at least 1');
      }
      if (_options.repeatReminderDays != null && _options.repeatReminderDays! < 1) {
        errors.add('Repeat reminder days must be at least 1');
      }
    }
    
    // Expiration date must be in the future
    if (_options.expiresAt != null && _options.expiresAt!.isBefore(DateTime.now())) {
      errors.add('Expiration date must be in the future');
    }
    
    return errors;
  }
  
  bool get isValid => validate().isEmpty;
  
  void reset() {
    _options = PackageOptions.defaults();
  }
}
```

---

## UI Examples

### Settings Configuration Screen

```dart
class PackageSettingsScreen extends StatefulWidget {
  final PackageOptions initialOptions;
  final Function(PackageOptions) onOptionsChanged;
  
  const PackageSettingsScreen({
    Key? key,
    required this.initialOptions,
    required this.onOptionsChanged,
  }) : super(key: key);
  
  @override
  State<PackageSettingsScreen> createState() => _PackageSettingsScreenState();
}

class _PackageSettingsScreenState extends State<PackageSettingsScreen> {
  late PackageOptionsManager _optionsManager;
  DateTime? _selectedExpirationDate;
  
  @override
  void initState() {
    super.initState();
    _optionsManager = PackageOptionsManager(initialOptions: widget.initialOptions);
    _selectedExpirationDate = widget.initialOptions.expiresAt;
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Package Settings'),
        actions: [
          TextButton(
            onPressed: () {
              final errors = _optionsManager.validate();
              if (errors.isNotEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(errors.join('\n')),
                    backgroundColor: Colors.red,
                  ),
                );
                return;
              }
              widget.onOptionsChanged(_optionsManager.options);
              Navigator.pop(context);
            },
            child: Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildExpirationSection(),
            SizedBox(height: 24),
            _buildReminderSection(),
            SizedBox(height: 24),
            _buildPermissionSection(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildExpirationSection() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Expiration Settings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            
            // Expiration Date
            ListTile(
              title: Text('Expiration Date'),
              subtitle: Text(
                _selectedExpirationDate != null
                    ? DateFormat('yyyy-MM-dd HH:mm').format(_selectedExpirationDate!)
                    : 'No expiration',
              ),
              trailing: Icon(Icons.calendar_today),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _selectedExpirationDate ?? DateTime.now().add(Duration(days: 7)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(Duration(days: 365)),
                );
                if (date != null) {
                  final time = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay.fromDateTime(
                      _selectedExpirationDate ?? DateTime.now(),
                    ),
                  );
                  if (time != null) {
                    setState(() {
                      _selectedExpirationDate = DateTime(
                        date.year,
                        date.month,
                        date.day,
                        time.hour,
                        time.minute,
                      );
                      _optionsManager.setExpiration(_selectedExpirationDate);
                      _notifyChanged();
                    });
                  }
                }
              },
            ),
            
            // Clear expiration button
            if (_selectedExpirationDate != null)
              TextButton(
                onPressed: () {
                  setState(() {
                    _selectedExpirationDate = null;
                    _optionsManager.setExpiration(null);
                    _notifyChanged();
                  });
                },
                child: Text('Remove Expiration'),
              ),
            
            SizedBox(height: 8),
            Divider(),
            SizedBox(height: 8),
            
            // Send Expiration Reminders
            SwitchListTile(
              title: Text('Send Expiration Reminders'),
              subtitle: Text('Send reminder before package expires'),
              value: _optionsManager.options.sendExpirationReminders,
              onChanged: _selectedExpirationDate == null
                  ? null
                  : (value) {
                      setState(() {
                        _optionsManager.setExpirationReminders(
                          enabled: value,
                          reminderPeriod: value ? '1_day_before' : null,
                        );
                        _notifyChanged();
                      });
                    },
            ),
            
            // Reminder Period
            if (_optionsManager.options.sendExpirationReminders && _selectedExpirationDate != null)
              Padding(
                padding: EdgeInsets.only(left: 16, top: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Reminder Period:', style: TextStyle(fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [
                        _buildReminderPeriodChip('1_day_before', '1 Day Before'),
                        _buildReminderPeriodChip('2_days_before', '2 Days Before'),
                        _buildReminderPeriodChip('1_hour_before', '1 Hour Before'),
                        _buildReminderPeriodChip('2_hours_before', '2 Hours Before'),
                      ],
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildReminderPeriodChip(String value, String label) {
    final isSelected = _optionsManager.options.reminderPeriod == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _optionsManager.setExpirationReminders(
            enabled: true,
            reminderPeriod: value,
          );
          _notifyChanged();
        });
      },
    );
  }
  
  Widget _buildReminderSection() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Automatic Reminders',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              'Send automatic reminders to participants who haven\'t completed their actions',
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
            SizedBox(height: 16),
            
            // Enable Automatic Reminders
            SwitchListTile(
              title: Text('Send Automatic Reminders'),
              value: _optionsManager.options.sendAutomaticReminders,
              onChanged: (value) {
                setState(() {
                  _optionsManager.setAutomaticReminders(
                    enabled: value,
                    firstReminderDays: value ? 3 : null,
                    repeatReminderDays: value ? 2 : null,
                  );
                  _notifyChanged();
                });
              },
            ),
            
            // First Reminder Days
            if (_optionsManager.options.sendAutomaticReminders)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('First Reminder (days after sending):'),
                    SizedBox(height: 8),
                    TextFormField(
                      initialValue: _optionsManager.options.firstReminderDays?.toString() ?? '3',
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        hintText: 'e.g., 3',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        final days = int.tryParse(value);
                        if (days != null && days > 0) {
                          _optionsManager.setAutomaticReminders(
                            enabled: true,
                            firstReminderDays: days,
                            repeatReminderDays: _optionsManager.options.repeatReminderDays ?? 2,
                          );
                          _notifyChanged();
                        }
                      },
                    ),
                  ],
                ),
              ),
            
            // Repeat Reminder Days
            if (_optionsManager.options.sendAutomaticReminders)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Repeat Reminder (days between reminders):'),
                    SizedBox(height: 8),
                    TextFormField(
                      initialValue: _optionsManager.options.repeatReminderDays?.toString() ?? '2',
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        hintText: 'e.g., 2',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        final days = int.tryParse(value);
                        if (days != null && days > 0) {
                          _optionsManager.setAutomaticReminders(
                            enabled: true,
                            firstReminderDays: _optionsManager.options.firstReminderDays ?? 3,
                            repeatReminderDays: days,
                          );
                          _notifyChanged();
                        }
                      },
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildPermissionSection() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Permissions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            
            // Allow Download Unsigned
            SwitchListTile(
              title: Text('Allow Download Before Signing'),
              subtitle: Text(
                'Participants can download the document before it\'s fully signed',
              ),
              value: _optionsManager.options.allowDownloadUnsigned,
              onChanged: (value) {
                setState(() {
                  _optionsManager.setAllowDownloadUnsigned(value);
                  _notifyChanged();
                });
              },
            ),
            
            Divider(),
            
            // Allow Reassign
            SwitchListTile(
              title: Text('Allow Reassignment'),
              subtitle: Text(
                'Participants can transfer their assignments to another contact',
              ),
              value: _optionsManager.options.allowReassign,
              onChanged: (value) {
                setState(() {
                  _optionsManager.setAllowReassign(value);
                  _notifyChanged();
                });
              },
            ),
            
            Divider(),
            
            // Allow Receivers to Add
            SwitchListTile(
              title: Text('Allow Receivers to Add Recipients'),
              subtitle: Text(
                'Receivers can add additional recipients to the package',
              ),
              value: _optionsManager.options.allowReceiversToAdd,
              onChanged: (value) {
                setState(() {
                  _optionsManager.setAllowReceiversToAdd(value);
                  _notifyChanged();
                });
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _notifyChanged() {
    widget.onOptionsChanged(_optionsManager.options);
  }
}
```

---

## Validation Rules

### Complete Validation Logic

```dart
class PackageOptionsValidator {
  static ValidationResult validate(PackageOptions options) {
    final errors = <String>[];
    final warnings = <String>[];
    
    // Expiration validation
    if (options.expiresAt != null) {
      if (options.expiresAt!.isBefore(DateTime.now())) {
        errors.add('Expiration date must be in the future');
      }
      
      // Check if expiration is too soon (warning)
      final daysUntilExpiry = options.expiresAt!.difference(DateTime.now()).inDays;
      if (daysUntilExpiry < 1) {
        warnings.add('Expiration date is less than 1 day away');
      }
    }
    
    // Expiration reminders validation
    if (options.sendExpirationReminders) {
      if (options.expiresAt == null) {
        errors.add('Cannot enable expiration reminders without an expiration date');
      } else if (options.reminderPeriod == null) {
        errors.add('Reminder period is required when expiration reminders are enabled');
      }
    }
    
    // Reminder period validation
    if (options.reminderPeriod != null) {
      if (!options.sendExpirationReminders) {
        errors.add('Reminder period requires expiration reminders to be enabled');
      }
      if (options.expiresAt == null) {
        errors.add('Reminder period requires an expiration date');
      }
      
      // Check if reminder period makes sense
      if (options.expiresAt != null && options.reminderPeriod != null) {
        final daysUntilExpiry = options.expiresAt!.difference(DateTime.now()).inDays;
        if (options.reminderPeriod!.contains('day') && daysUntilExpiry < 2) {
          warnings.add('Expiration is too soon for day-based reminder period');
        }
        if (options.reminderPeriod!.contains('hour') && daysUntilExpiry < 1) {
          warnings.add('Expiration is too soon for hour-based reminder period');
        }
      }
    }
    
    // Automatic reminders validation
    if (options.sendAutomaticReminders) {
      if (options.firstReminderDays == null) {
        errors.add('First reminder days is required when automatic reminders are enabled');
      } else if (options.firstReminderDays! < 1) {
        errors.add('First reminder days must be at least 1');
      }
      
      if (options.repeatReminderDays == null) {
        errors.add('Repeat reminder days is required when automatic reminders are enabled');
      } else if (options.repeatReminderDays! < 1) {
        errors.add('Repeat reminder days must be at least 1');
      }
    }
    
    // Validate automatic reminders with expiration
    if (options.sendAutomaticReminders && options.expiresAt != null) {
      final daysUntilExpiry = options.expiresAt!.difference(DateTime.now()).inDays;
      if (options.firstReminderDays != null && options.firstReminderDays! >= daysUntilExpiry) {
        warnings.add('First reminder is set after expiration date');
      }
    }
    
    return ValidationResult(
      isValid: errors.isEmpty,
      errors: errors,
      warnings: warnings,
    );
  }
}

class ValidationResult {
  final bool isValid;
  final List<String> errors;
  final List<String> warnings;
  
  ValidationResult({
    required this.isValid,
    required this.errors,
    required this.warnings,
  });
}
```

---

## API Integration

### Sending Options to API

When creating or updating a package, include the options in the request body:

```dart
Future<void> savePackage(Package package) async {
  final payload = {
    'name': package.name,
    'attachment_uuid': package.attachment_uuid,
    'fileUrl': package.fileUrl,
    's3Key': package.s3Key,
    'fields': package.fields.map((f) => f.toJson()).toList(),
    'receivers': package.receivers.map((r) => r.toJson()).toList(),
    'options': package.options.toJson(), // Include options
    'customMessage': package.customMessage ?? '',
    'status': package.status,
  };
  
  final response = await http.post(
    Uri.parse('$baseUrl/api/packages'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: json.encode(payload),
  );
  
  if (response.statusCode != 201) {
    final errorData = json.decode(response.body);
    throw Exception(errorData['error'] ?? 'Failed to save package');
  }
}
```

### Options JSON Format

```json
{
  "options": {
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "sendExpirationReminders": true,
    "reminderPeriod": "1_day_before",
    "sendAutomaticReminders": true,
    "firstReminderDays": 3,
    "repeatReminderDays": 2,
    "allowDownloadUnsigned": true,
    "allowReassign": true,
    "allowReceiversToAdd": true
  }
}
```

---

## Best Practices

### 1. Default Values

Always use default values when initializing options:

```dart
// ✅ CORRECT
final options = PackageOptions.defaults();

// ❌ WRONG
final options = PackageOptions(); // Might miss some defaults
```

### 2. Validation Before Saving

Always validate options before sending to API:

```dart
Future<void> savePackage(Package package) async {
  final validation = PackageOptionsValidator.validate(package.options);
  
  if (!validation.isValid) {
    showError('Please fix the following errors:\n${validation.errors.join('\n')}');
    return;
  }
  
  if (validation.warnings.isNotEmpty) {
    final proceed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Warnings'),
        content: Text(validation.warnings.join('\n')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Proceed'),
          ),
        ],
      ),
    );
    
    if (proceed != true) return;
  }
  
  // Proceed with save
  await _savePackageToAPI(package);
}
```

### 3. State Management

Use immutable state management for options:

```dart
// ✅ CORRECT - Use copyWith
options = options.copyWith(allowReassign: false);

// ❌ WRONG - Direct mutation
options.allowReassign = false; // Will cause issues with state management
```

### 4. User Feedback

Provide clear feedback about what each setting does:

```dart
SwitchListTile(
  title: Text('Allow Reassignment'),
  subtitle: Text(
    'When enabled, participants can transfer their assignments to another contact. '
    'This option is disabled once any field has been signed.',
    style: TextStyle(fontSize: 12),
  ),
  value: options.allowReassign,
  onChanged: (value) {
    setState(() {
      options = options.copyWith(allowReassign: value);
    });
  },
)
```

### 5. Conditional UI

Show/hide related settings based on parent settings:

```dart
// Only show reminder period if expiration reminders are enabled
if (options.sendExpirationReminders && options.expiresAt != null)
  _buildReminderPeriodSelector()

// Only show reminder schedule if automatic reminders are enabled
if (options.sendAutomaticReminders)
  _buildReminderScheduleInputs()
```

---

## Summary

### Key Points

1. **Expiration Settings**:
   - Set `expiresAt` to enable expiration
   - `sendExpirationReminders` requires `expiresAt`
   - `reminderPeriod` requires both expiration and reminders enabled

2. **Automatic Reminders**:
   - Enable with `sendAutomaticReminders = true`
   - Requires `firstReminderDays` and `repeatReminderDays`
   - Works independently of expiration reminders

3. **Permissions**:
   - `allowDownloadUnsigned`: Control document download access
   - `allowReassign`: Control field reassignment
   - `allowReceiversToAdd`: Control receiver additions

4. **Validation**:
   - Always validate before saving
   - Check dependencies between settings
   - Provide user-friendly error messages

5. **Defaults**:
   - Most permissions default to `true`
   - Most reminder settings default to `false`
   - Always use `PackageOptions.defaults()` for initialization

---

**Version:** 1.0  
**Last Updated:** 2024

