import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Building, MapPin, Users, Calendar, BarChart3 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import api from '../lib/api';

interface CompanyStats {
  totalEvents: number
  teamMembers: number
  locations: number
  eventsThisMonth: number
}

interface CompanyInfo {
  name: string
  industry: string
  location: string
  founded: string
}

const CompanyPage: React.FC = () => {
  const { t } = useTranslation();
  const language = useLanguage((state) => state.language);
  const isRTL = language === 'ar';
  const [stats, setStats] = useState<CompanyStats>({
    totalEvents: 0,
    teamMembers: 0,
    locations: 0,
    eventsThisMonth: 0
  });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    industry: '',
    location: '',
    founded: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        
        // Fetch company statistics
        const statsResponse = await api.get('/company/stats');
        const statsData = statsResponse.data.data || {
          totalEvents: 0,
          teamMembers: 0,
          locations: 0,
          eventsThisMonth: 0
        };
        
        // Fetch company information
        const infoResponse = await api.get('/company/info');
        const infoData = infoResponse.data.data || {
          name: '',
          industry: '',
          location: '',
          founded: ''
        };
        
        setStats(statsData);
        setCompanyInfo(infoData);
      } catch (error) {
        console.error('Failed to fetch company data:', error);
        // Set default values on error
        setStats({
          totalEvents: 0,
          teamMembers: 0,
          locations: 0,
          eventsThisMonth: 0
        });
        setCompanyInfo({
          name: '',
          industry: '',
          location: '',
          founded: ''
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('navigation.company')}</h1>
        <p className="text-gray-600 mt-1">{t('company.subtitle')}</p>
      </div>

      {/* Company Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('company.stats.totalEvents')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">{t('company.stats.eventsScheduled')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">Active staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locations}</div>
            <p className="text-xs text-muted-foreground">Venues managed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsThisMonth}</div>
            <p className="text-xs text-muted-foreground">{t('company.stats.eventsScheduled')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Company Name</label>
              <p className="text-gray-900">{companyInfo.name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Industry</label>
              <p className="text-gray-900">{companyInfo.industry || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Location</label>
              <p className="text-gray-900">{companyInfo.location || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Founded</label>
              <p className="text-gray-900">{companyInfo.founded || 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyPage; 