import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, FolderOpen, Trash2, Search, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SavedSearchManager({ 
  currentQuery, 
  currentFilters, 
  searchType, 
  onLoadSearch,
  userId,
  companyId 
}) {
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [notifyOnNew, setNotifyOnNew] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedSearches();
  }, [userId]);

  const loadSavedSearches = async () => {
    try {
      const searches = await base44.entities.SavedSearch.filter({ 
        user_id: userId,
        search_type: searchType 
      });
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;
    
    setLoading(true);
    try {
      await base44.entities.SavedSearch.create({
        user_id: userId,
        company_id: companyId,
        name: searchName,
        search_type: searchType,
        query: currentQuery,
        filters: currentFilters,
        notify_on_new: notifyOnNew
      });

      await loadSavedSearches();
      setShowSaveDialog(false);
      setSearchName('');
      setNotifyOnNew(false);
    } catch (error) {
      console.error('Failed to save search:', error);
    }
    setLoading(false);
  };

  const handleLoadSearch = (search) => {
    onLoadSearch(search.query, search.filters);
    setShowLoadDialog(false);
  };

  const handleDeleteSearch = async (searchId) => {
    try {
      await base44.entities.SavedSearch.delete(searchId);
      await loadSavedSearches();
    } catch (error) {
      console.error('Failed to delete search:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSaveDialog(true)}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        Save Search
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowLoadDialog(true)}
        className="gap-2"
      >
        <FolderOpen className="w-4 h-4" />
        Saved ({savedSearches.length})
      </Button>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Name</label>
              <Input
                placeholder="e.g., Senior React Developers"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notify"
                checked={notifyOnNew}
                onChange={(e) => setNotifyOnNew(e.target.checked)}
                className="w-4 h-4 text-pink-500"
              />
              <label htmlFor="notify" className="text-sm text-gray-700">
                Notify me when new candidates match this search
              </label>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Current search criteria:</p>
              <p className="text-sm font-medium">{currentQuery || '(All candidates)'}</p>
              {Object.keys(currentFilters || {}).length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  + {Object.keys(currentFilters).length} filter{Object.keys(currentFilters).length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSearch} 
              disabled={!searchName.trim() || loading}
              className="swipe-gradient text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Saved Searches</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No saved searches yet</p>
              </div>
            ) : (
              savedSearches.map((search) => (
                <Card key={search.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{search.name}</h4>
                          {search.notify_on_new && (
                            <Badge variant="outline" className="text-xs">
                              <Bell className="w-3 h-3 mr-1" />
                              Alerts On
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Query: {search.query || '(All)'}
                        </p>
                        {search.filters && Object.keys(search.filters).length > 0 && (
                          <p className="text-xs text-gray-500">
                            {Object.keys(search.filters).length} filter{Object.keys(search.filters).length > 1 ? 's' : ''} applied
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadSearch(search)}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSearch(search.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}