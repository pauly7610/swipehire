import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Linkedin, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompanyTeamSection({ team, companyName }) {
  if (!team || team.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Meet the Team</h3>
          <p className="text-gray-500">Team members from {companyName} will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Meet the Team</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="relative mx-auto w-24 h-24 md:w-28 md:h-28 mb-3">
                {member.photo_url ? (
                  <img 
                    src={member.photo_url} 
                    alt={member.name} 
                    className="w-full h-full rounded-2xl object-cover shadow-md group-hover:shadow-lg transition-shadow"
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-2xl">
                      {member.name?.charAt(0)}
                    </span>
                  </div>
                )}
                {member.linkedin_url && (
                  <a 
                    href={member.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-700"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{member.name}</h4>
              <p className="text-gray-500 text-xs">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}