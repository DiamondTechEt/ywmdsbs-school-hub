import React from 'react';
import { AlertTriangle, Lock, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BannedScreenProps {
  banStatus: {
    isBanned: boolean;
    bannedAt?: string;
    bannedBy?: string;
    banReason?: string;
    banNotes?: string;
  };
  userRole: 'student' | 'teacher';
}

export function BannedScreen({ banStatus, userRole }: BannedScreenProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleContactSupport = () => {
    // Create email with pre-filled information
    const subject = encodeURIComponent(`Account Ban Appeal - ${userRole === 'student' ? 'Student' : 'Teacher'}`);
    const body = encodeURIComponent(
      `I am writing to appeal my account ban.\n\n` +
      `Role: ${userRole === 'student' ? 'Student' : 'Teacher'}\n` +
      `Banned on: ${formatDate(banStatus.bannedAt)}\n` +
      `Banned by: ${banStatus.bannedBy || 'Unknown'}\n` +
      `Reason: ${banStatus.banReason || 'Not specified'}\n\n` +
      `Please review my case and consider reinstating my account access.\n\n` +
      `Thank you.`
    );
    
    window.location.href = `mailto:support@school.edu?subject=${subject}&body=${body}`;
  };

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force reload as fallback
      window.location.reload();
    }
  };

  if (!banStatus.isBanned) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Warning Card */}
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">
              Account Access Suspended
            </CardTitle>
            <p className="text-red-600 text-lg">
              Your {userRole === 'student' ? 'student' : 'teacher'} account has been temporarily suspended
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Ban Details */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-800">Ban Details</h3>
                  
                  {banStatus.bannedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(banStatus.bannedAt)}</span>
                    </div>
                  )}
                  
                  {banStatus.bannedBy && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Suspended by:</span>
                      <span className="font-medium">{banStatus.bannedBy}</span>
                    </div>
                  )}
                  
                  {banStatus.banReason && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reason:</span>
                      <Badge variant="destructive" className="ml-2">
                        {banStatus.banReason}
                      </Badge>
                    </div>
                  )}
                  
                  {banStatus.banNotes && (
                    <div className="mt-3 p-3 bg-white rounded border border-red-200">
                      <p className="text-sm text-gray-700">
                        <strong>Additional Notes:</strong>
                      </p>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                        {banStatus.banNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* What to do next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3">What to do next?</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Review the ban details above to understand why your account was suspended</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Contact the administration to appeal this decision if you believe it was made in error</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Wait for the suspension period to end (if applicable)</span>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>support@school.edu</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleContactSupport}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>

            {/* Legal Notice */}
            <div className="text-center text-xs text-gray-500 pt-4 border-t">
              <p>
                This suspension is in accordance with our terms of service and code of conduct. 
                All appeals will be reviewed within 3-5 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
