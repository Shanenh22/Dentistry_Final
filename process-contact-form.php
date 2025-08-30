<?php
/*
 * Spring Valley Dental Associates - Contact Form Processor
 * Save as: process-contact-form.php
 * 
 * This script processes the contact form submission and sends
 * a professionally formatted HTML email to the dental practice.
 */

// Configuration
$to_email = 'info@springvalleydentistry.com';
$from_email = 'noreply@springvalleydentistry.com';
$practice_name = 'Spring Valley Dental Associates';

// Set content type for JSON response
header('Content-Type: application/json');

// Check if form was submitted via POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Sanitize and validate input data
function sanitize_input($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Collect and sanitize form data
$firstName = sanitize_input($_POST['firstName'] ?? '');
$lastName = sanitize_input($_POST['lastName'] ?? '');
$email = sanitize_input($_POST['email'] ?? '');
$phone = sanitize_input($_POST['phone'] ?? '');
$dateOfBirth = sanitize_input($_POST['dateOfBirth'] ?? 'Not provided');
$contactMethod = sanitize_input($_POST['contactMethod'] ?? 'Email');
$contactReason = sanitize_input($_POST['contactReason'] ?? '');
$urgency = sanitize_input($_POST['urgency'] ?? 'routine');
$preferredDate = sanitize_input($_POST['preferredDate'] ?? 'Not specified');
$preferredTime = sanitize_input($_POST['preferredTime'] ?? 'No preference');
$referralSource = sanitize_input($_POST['referralSource'] ?? 'Not specified');
$insurance = sanitize_input($_POST['insurance'] ?? 'Not specified');
$message = sanitize_input($_POST['message'] ?? '');

// Handle services array
$services = $_POST['services'] ?? [];
$services_clean = array_map('sanitize_input', $services);

// Handle availability array
$availability = $_POST['availability'] ?? [];
$availability_clean = array_map('sanitize_input', $availability);

// Validation
$errors = [];

if (empty($firstName)) $errors[] = 'First name is required';
if (empty($lastName)) $errors[] = 'Last name is required';
if (empty($email) || !validate_email($email)) $errors[] = 'Valid email is required';
if (empty($phone)) $errors[] = 'Phone number is required';
if (empty($contactReason)) $errors[] = 'Contact reason is required';
if (empty($message)) $errors[] = 'Message is required';

if (!empty($errors)) {
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// Load and process email template
$template_path = 'email-template.html';
if (!file_exists($template_path)) {
    echo json_encode(['success' => false, 'message' => 'Email template not found']);
    exit;
}

$html_template = file_get_contents($template_path);

// Create priority badge and subject line
$priority_map = [
    'emergency' => ['text' => 'EMERGENCY', 'emoji' => '🔴'],
    'urgent' => ['text' => 'URGENT', 'emoji' => '🟡'],
    'soon' => ['text' => 'SOON', 'emoji' => '🟡'],
    'routine' => ['text' => 'ROUTINE', 'emoji' => '🟢']
];

$priority_info = $priority_map[$urgency] ?? $priority_map['routine'];
$subject = $priority_info['emoji'] . ' ' . $priority_info['text'] . ' - ' . $firstName . ' ' . $lastName . ' - New Patient Inquiry';

// Format services as HTML tags
$services_html = '';
if (!empty($services_clean)) {
    foreach ($services_clean as $service) {
        $service_display = ucwords(str_replace('-', ' ', $service));
        $services_html .= '<span class="service-tag">' . $service_display . '</span>';
    }
} else {
    $services_html = '<span class="value">None specified</span>';
}

// Format availability
$availability_text = !empty($availability_clean) ? implode(', ', array_map('ucfirst', $availability_clean)) : 'Not specified';

// Format contact reason for display
$reason_map = [
    'new-patient' => 'New Patient Inquiry',
    'appointment' => 'Schedule Appointment',
    'emergency' => 'Dental Emergency',
    'consultation' => 'Consultation Request',
    'insurance' => 'Insurance Questions',
    'general' => 'General Question',
    'complaint' => 'Complaint/Concern',
    'other' => 'Other'
];
$contact_reason_display = $reason_map[$contactReason] ?? ucwords($contactReason);

// Replace template variables
$replacements = [
    '{{firstName}}' => $firstName,
    '{{lastName}}' => $lastName,
    '{{email}}' => $email,
    '{{phone}}' => $phone,
    '{{dateOfBirth}}' => $dateOfBirth,
    '{{contactMethod}}' => ucfirst($contactMethod),
    '{{contactReason}}' => $contact_reason_display,
    '{{urgency}}' => $urgency,
    '{{urgency_text}}' => $priority_info['text'],
    '{{preferredDate}}' => $preferredDate,
    '{{preferredTime}}' => ucfirst($preferredTime),
    '{{availability}}' => $availability_text,
    '{{referralSource}}' => ucwords(str_replace('-', ' ', $referralSource)),
    '{{insurance}}' => ucfirst($insurance),
    '{{message}}' => nl2br($message),
    '{{services_tags}}' => $services_html
];

$html_content = str_replace(array_keys($replacements), array_values($replacements), $html_template);

// Set up email headers
$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    'From: ' . $practice_name . ' Website <' . $from_email . '>',
    'Reply-To: ' . $firstName . ' ' . $lastName . ' <' . $email . '>',
    'X-Mailer: PHP/' . phpversion(),
    'X-Priority: ' . ($urgency === 'emergency' ? '1' : ($urgency === 'urgent' ? '2' : '3'))
];

// Send email
$mail_sent = mail($to_email, $subject, $html_content, implode("\r\n", $headers));

if ($mail_sent) {
    // Log successful submission (optional)
    $log_entry = date('Y-m-d H:i:s') . " - New inquiry from: $firstName $lastName ($email) - Priority: $urgency\n";
    file_put_contents('contact_submissions.log', $log_entry, FILE_APPEND | LOCK_EX);
    
    echo json_encode([
        'success' => true, 
        'message' => 'Your message has been sent successfully. We will contact you within 24 hours.'
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'message' => 'There was an error sending your message. Please try calling us directly at (972) 852-2222.'
    ]);
}
?>